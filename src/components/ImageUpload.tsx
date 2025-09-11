import React, { useState } from 'react';
import { View, Image, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Surface, Text, IconButton, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { compressImage } from '../utils/imageUtils';

interface ImageUploadProps {
  onImageSelected: (uri: string | { uri: string; compressed?: boolean }) => void;
  onImageRemoved?: () => void;
  selectedImageUri?: string;
  compressImage?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  onImageRemoved,
  selectedImageUri,
  compressImage: shouldCompress = true
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handleCameraPress = async () => {
    try {
      setIsLoading(true);
      
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          '권한 필요',
          '카메라 사용 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        let finalUri = result.assets[0].uri;
        
        if (shouldCompress) {
          const compressed = await compressImage(finalUri);
          onImageSelected({ uri: compressed.uri, compressed: true });
        } else {
          onImageSelected(finalUri);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        '오류',
        '카메라를 실행할 수 없습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryPress = async () => {
    try {
      setIsLoading(true);
      
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        Alert.alert(
          '권한 필요',
          '사진 라이브러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        let finalUri = result.assets[0].uri;
        
        if (shouldCompress) {
          const compressed = await compressImage(finalUri);
          onImageSelected({ uri: compressed.uri, compressed: true });
        } else {
          onImageSelected(finalUri);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(
        '오류',
        '갤러리를 실행할 수 없습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <View style={styles.container}>
      {/* Image Preview Section */}
      {selectedImageUri ? (
        <Surface style={styles.previewContainer} elevation={1}>
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.imagePreview}
            testID="image-preview"
          />
          <IconButton
            icon="close-circle"
            iconColor={Colors.error}
            size={24}
            style={styles.removeButton}
            onPress={handleRemoveImage}
            testID="remove-image-button"
          />
        </Surface>
      ) : (
        <Surface style={styles.placeholderContainer} elevation={1}>
          <MaterialCommunityIcons
            name="image-plus"
            size={48}
            color={Colors.text.secondary}
          />
          <Text 
            variant="bodyMedium" 
            style={styles.placeholderText}
          >
            사진을 추가해주세요
          </Text>
        </Surface>
      )}

      {/* Button Section */}
      <View style={styles.buttonContainer}>
        <TouchableRipple
          onPress={handleCameraPress}
          style={styles.button}
          testID="camera-button"
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons
              name="camera"
              size={24}
              color={Colors.primary.main}
            />
            <Text 
              variant="labelLarge" 
              style={[styles.buttonText, { color: Colors.primary.main }]}
            >
              카메라
            </Text>
          </View>
        </TouchableRipple>

        <TouchableRipple
          onPress={handleGalleryPress}
          style={styles.button}
          testID="gallery-button"
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons
              name="image"
              size={24}
              color={Colors.primary.main}
            />
            <Text 
              variant="labelLarge" 
              style={[styles.buttonText, { color: Colors.primary.main }]}
            >
              갤러리
            </Text>
          </View>
        </TouchableRipple>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay} testID="loading-indicator">
          <ActivityIndicator 
            size="large" 
            color={Colors.primary.main} 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  previewContainer: {
    backgroundColor: Colors.background.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.background.surface,
    borderRadius: 20,
  },
  placeholderContainer: {
    backgroundColor: Colors.background.surface,
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border.outline,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    fontFamily: 'OpenSans-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.background.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    paddingVertical: Spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    fontFamily: 'OpenSans-SemiBold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});