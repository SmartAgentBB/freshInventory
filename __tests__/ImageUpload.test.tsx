import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImageUpload } from '../src/components/ImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ImageUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to granted permissions
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
    });
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
    });
  });

  describe('Camera functionality', () => {
    it('should open camera when camera button is pressed', async () => {
      const mockOnImageSelected = jest.fn();
      const mockImageUri = 'file:///path/to/image.jpg';
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });

      const { getByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        expect(mockOnImageSelected).toHaveBeenCalledWith(mockImageUri);
      });
    });

    it('should handle camera permission denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: ImagePicker.PermissionStatus.DENIED,
      });

      const mockOnImageSelected = jest.fn();
      const { getByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '권한 필요',
          '카메라 사용 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
        );
        expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
      });
    });

    it('should handle camera cancellation', async () => {
      const mockOnImageSelected = jest.fn();
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
        expect(mockOnImageSelected).not.toHaveBeenCalled();
      });
    });
  });

  describe('Gallery functionality', () => {
    it('should open gallery when gallery button is pressed', async () => {
      const mockOnImageSelected = jest.fn();
      const mockImageUri = 'file:///path/to/gallery/image.jpg';
      
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });

      const { getByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      const galleryButton = getByTestId('gallery-button');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        expect(mockOnImageSelected).toHaveBeenCalledWith(mockImageUri);
      });
    });

    it('should handle gallery permission denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: ImagePicker.PermissionStatus.DENIED,
      });

      const mockOnImageSelected = jest.fn();
      const { getByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      const galleryButton = getByTestId('gallery-button');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '권한 필요',
          '사진 라이브러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
        );
        expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('Image preview', () => {
    it('should display selected image preview', async () => {
      const mockOnImageSelected = jest.fn();
      const mockImageUri = 'file:///path/to/image.jpg';
      
      const { getByTestId, queryByTestId } = render(
        <ImageUpload 
          onImageSelected={mockOnImageSelected}
          selectedImageUri={mockImageUri}
        />
      );

      // Should display image preview
      const imagePreview = getByTestId('image-preview');
      expect(imagePreview.props.source).toEqual({ uri: mockImageUri });

      // Should show remove button
      const removeButton = getByTestId('remove-image-button');
      expect(removeButton).toBeTruthy();
    });

    it('should remove image preview when remove button is pressed', async () => {
      const mockOnImageSelected = jest.fn();
      const mockOnImageRemoved = jest.fn();
      const mockImageUri = 'file:///path/to/image.jpg';
      
      const { getByTestId, queryByTestId } = render(
        <ImageUpload 
          onImageSelected={mockOnImageSelected}
          onImageRemoved={mockOnImageRemoved}
          selectedImageUri={mockImageUri}
        />
      );

      const removeButton = getByTestId('remove-image-button');
      fireEvent.press(removeButton);

      expect(mockOnImageRemoved).toHaveBeenCalled();
    });

    it('should not display preview when no image is selected', () => {
      const mockOnImageSelected = jest.fn();
      
      const { queryByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      expect(queryByTestId('image-preview')).toBeNull();
      expect(queryByTestId('remove-image-button')).toBeNull();
    });
  });

  describe('UI elements', () => {
    it('should display camera and gallery buttons', () => {
      const mockOnImageSelected = jest.fn();
      
      const { getByTestId, getByText } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('gallery-button')).toBeTruthy();
      expect(getByText('카메라')).toBeTruthy();
      expect(getByText('갤러리')).toBeTruthy();
    });

    it('should show loading state while processing image', async () => {
      const mockOnImageSelected = jest.fn();
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const cameraPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockReturnValue(cameraPromise);

      const { getByTestId, queryByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      // Should show loading indicator immediately after pressing button
      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeTruthy();
      });

      // Resolve the camera promise
      resolvePromise!({
        canceled: false,
        assets: [{ uri: 'file:///test.jpg' }],
      });

      // Should hide loading indicator after completion
      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle camera launch errors', async () => {
      const mockOnImageSelected = jest.fn();
      const errorMessage = 'Camera not available';
      
      (ImagePicker.launchCameraAsync as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { getByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '오류',
          '카메라를 실행할 수 없습니다. 다시 시도해주세요.'
        );
        expect(mockOnImageSelected).not.toHaveBeenCalled();
      });
    });

    it('should handle gallery launch errors', async () => {
      const mockOnImageSelected = jest.fn();
      
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValue(
        new Error('Gallery error')
      );

      const { getByTestId } = render(
        <ImageUpload onImageSelected={mockOnImageSelected} />
      );

      const galleryButton = getByTestId('gallery-button');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '오류',
          '갤러리를 실행할 수 없습니다. 다시 시도해주세요.'
        );
        expect(mockOnImageSelected).not.toHaveBeenCalled();
      });
    });
  });
});