import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddItemWithImage } from '../src/components/AddItemWithImage';
import { AIService } from '../src/services/AIService';
import { uploadImageToSupabase } from '../src/services/StorageService';
import { InventoryService } from '../src/services/InventoryService';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../src/services/AIService');
jest.mock('../src/services/StorageService');
jest.mock('../src/services/InventoryService');
jest.mock('expo-image-picker');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AddItemWithImage Component', () => {
  let mockAnalyzeImage: jest.Mock;
  let mockAddItem: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup AI Service mock
    mockAnalyzeImage = jest.fn();
    (AIService as jest.Mock).mockImplementation(() => ({
      analyzeImage: mockAnalyzeImage,
    }));
    
    // Setup Inventory Service mock
    mockAddItem = jest.fn();
    (InventoryService as jest.Mock).mockImplementation(() => ({
      addItem: mockAddItem,
    }));
    
    // Setup Storage Service mock
    (uploadImageToSupabase as jest.Mock).mockResolvedValue({
      success: true,
      path: 'user123/image.jpg',
      publicUrl: 'https://example.com/image.jpg',
    });
    
    // Setup ImagePicker mock
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
  });

  describe('Loading state during AI analysis', () => {
    it('should show loading indicator during AI analysis', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockOnComplete = jest.fn();
      
      // Delay AI analysis to test loading state
      mockAnalyzeImage.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          items: [{ name: '사과', quantity: 3, unit: '개', category: '과일' }],
        }), 100))
      );
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });
      
      const { getByTestId, queryByTestId } = render(
        <AddItemWithImage onComplete={mockOnComplete} userId="user123" />
      );
      
      // Take photo
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      // After selecting image, should start analysis
      await waitFor(() => {
        expect(queryByTestId('ai-analysis-loading')).toBeTruthy();
      });
      
      // After analysis completes, loading should disappear
      await waitFor(() => {
        expect(queryByTestId('ai-analysis-loading')).toBeNull();
      }, { timeout: 200 });
    });

    it('should disable buttons during AI analysis', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      
      mockAnalyzeImage.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          items: [],
        }), 100))
      );
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });
      
      const { getByTestId } = render(
        <AddItemWithImage onComplete={jest.fn()} userId="user123" />
      );
      
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      await waitFor(() => {
        expect(getByTestId('camera-button').props.disabled).toBe(true);
        expect(getByTestId('gallery-button').props.disabled).toBe(true);
      });
    });
  });

  describe('Displaying detected items', () => {
    it('should display detected items for user confirmation', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockDetectedItems = [
        { name: '사과', quantity: 3, unit: '개', category: '과일' },
        { name: '우유', quantity: 1, unit: 'L', category: '유제품' },
      ];
      
      mockAnalyzeImage.mockResolvedValue({
        success: true,
        items: mockDetectedItems,
      });
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });
      
      const { getByTestId, getByText } = render(
        <AddItemWithImage onComplete={jest.fn()} userId="user123" />
      );
      
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      await waitFor(() => {
        expect(getByText('감지된 재료')).toBeTruthy();
        expect(getByTestId('detected-items-list')).toBeTruthy();
        // Check inline name inputs
        expect(getByTestId('item-0-name-input').props.value).toBe('사과');
        expect(getByTestId('item-1-name-input').props.value).toBe('우유');
        // Check quantity display
        expect(getByText('3')).toBeTruthy();
        expect(getByText('1')).toBeTruthy();
      });
    });

    it('should allow editing detected item information', async () => {
      const mockDetectedItems = [
        { name: '사과', quantity: 3, unit: '개', category: '과일' },
      ];
      
      mockAnalyzeImage.mockResolvedValue({
        success: true,
        items: mockDetectedItems,
      });
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///image.jpg' }],
      });
      
      const { getByTestId, getByText } = render(
        <AddItemWithImage onComplete={jest.fn()} userId="user123" />
      );
      
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      await waitFor(() => {
        expect(getByTestId('item-0-name-input')).toBeTruthy();
      });
      
      // Items are always editable inline now
      const nameInput = getByTestId('item-0-name-input');
      
      // Edit name directly
      fireEvent.changeText(nameInput, '빨간 사과');
      
      // Test quantity change with increment button
      const incrementButton = getByTestId('item-0-increment');
      fireEvent.press(incrementButton);
      fireEvent.press(incrementButton);
      
      await waitFor(() => {
        expect(nameInput.props.value).toBe('빨간 사과');
        expect(getByText('5')).toBeTruthy(); // 3 + 2 = 5
      });
    });

    it('should allow removing detected items', async () => {
      const mockDetectedItems = [
        { name: '사과', quantity: 3, unit: '개', category: '과일' },
        { name: '우유', quantity: 1, unit: 'L', category: '유제품' },
      ];
      
      mockAnalyzeImage.mockResolvedValue({
        success: true,
        items: mockDetectedItems,
      });
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///image.jpg' }],
      });
      
      const { getByTestId, queryByText } = render(
        <AddItemWithImage onComplete={jest.fn()} userId="user123" />
      );
      
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      await waitFor(() => {
        expect(getByTestId('item-0-delete')).toBeTruthy();
      });
      
      // Remove first item
      fireEvent.press(getByTestId('item-0-delete'));
      
      await waitFor(() => {
        // First item should be removed
        expect(queryByTestId('item-1-name-input')).toBeNull();
        // Second item should now be first (index 0)
        expect(getByTestId('item-0-name-input').props.value).toBe('우유');
      });
    });
  });

  describe('Saving corrected information', () => {
    it('should save all confirmed items to inventory', async () => {
      const mockDetectedItems = [
        { name: '사과', quantity: 3, unit: '개', category: '과일' },
        { name: '우유', quantity: 1, unit: 'L', category: '유제품' },
      ];
      
      mockAnalyzeImage.mockResolvedValue({
        success: true,
        items: mockDetectedItems,
      });
      
      mockAddItem.mockResolvedValue({ success: true });
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///image.jpg' }],
      });
      
      const mockOnComplete = jest.fn();
      
      const { getByTestId, getByText } = render(
        <AddItemWithImage onComplete={mockOnComplete} userId="user123" />
      );
      
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      await waitFor(() => {
        expect(getByTestId('save-all-button')).toBeTruthy();
      });
      
      // Save all items
      fireEvent.press(getByTestId('save-all-button'));
      
      await waitFor(() => {
        // Should call addItem for each detected item
        expect(mockAddItem).toHaveBeenCalledTimes(2);
        expect(mockAddItem).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '사과',
            quantity: 3,
            unit: '개',
            category: '과일',
          })
        );
        expect(mockAddItem).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '우유',
            quantity: 1,
            unit: 'L',
            category: '유제품',
          })
        );
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should save corrected information for learning', async () => {
      const mockDetectedItems = [
        { name: '사과', quantity: 3, unit: '개', category: '과일' },
      ];
      
      mockAnalyzeImage.mockResolvedValue({
        success: true,
        items: mockDetectedItems,
      });
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///image.jpg' }],
      });
      
      const { getByTestId } = render(
        <AddItemWithImage onComplete={jest.fn()} userId="user123" />
      );
      
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      await waitFor(() => {
        expect(getByTestId('item-0-name-input')).toBeTruthy();
      });
      
      // Edit item directly (inline editing)
      const nameInput = getByTestId('item-0-name-input');
      fireEvent.changeText(nameInput, '빨간 사과');
      
      // Save all items
      fireEvent.press(getByTestId('save-all-button'));
      
      await waitFor(() => {
        // Should save the corrected information
        expect(mockAddItem).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '빨간 사과',
            originalName: '사과', // Store original for learning
          })
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should show error message when AI analysis fails', async () => {
      mockAnalyzeImage.mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
        items: [],
      });
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///image.jpg' }],
      });
      
      const { getByTestId, getByText } = render(
        <AddItemWithImage onComplete={jest.fn()} userId="user123" />
      );
      
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '분석 실패',
          'AI 서비스를 사용할 수 없습니다. 수동으로 입력해주세요.'
        );
      });
    });

    it('should show message when no items are detected', async () => {
      mockAnalyzeImage.mockResolvedValue({
        success: true,
        items: [],
      });
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///image.jpg' }],
      });
      
      const { getByTestId, getByText } = render(
        <AddItemWithImage onComplete={jest.fn()} userId="user123" />
      );
      
      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);
      
      await waitFor(() => {
        expect(getByText('식재료를 감지하지 못했습니다')).toBeTruthy();
        expect(getByTestId('manual-input-button')).toBeTruthy();
      });
    });
  });
});