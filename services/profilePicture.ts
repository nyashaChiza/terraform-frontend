import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { BASE_URL, buildAuthHeader } from './api';

/**
 * Opens the device image library, compresses the selected image,
 * uploads it via the backend to Cloudinary, and returns the response body.
 *
 * Returns null if the user cancels the picker.
 * Throws on permission denial or upload failure.
 */
export async function pickAndUploadProfilePicture(): Promise<{ profile_picture_url: string } | null> {
  // Request media library permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access photos was denied.');
  }

  // Open image picker (square crop UI)
  // Note: in newer expo-image-picker, `MediaType` is a TypeScript type only —
  // not a runtime enum. Pass the string literal `'images'` (or an array) instead.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled) return null;

  // Compress and resize to max 600×600 before upload to save bandwidth
  const compressed = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 600, height: 600 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  // Build multipart form data — must NOT set Content-Type manually;
  // the browser/RN sets it automatically with the correct boundary.
  const formData = new FormData();
  formData.append('file', {
    uri: compressed.uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as any);

  const response = await fetch(`${BASE_URL}/api/users/me/profile-picture`, {
    method: 'POST',
    headers: buildAuthHeader(),   // Auth only — no Content-Type
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.detail ?? 'Upload failed. Please try again.');
  }

  return response.json();
}

/**
 * Deletes the current user's profile picture via the backend.
 */
export async function removeProfilePicture(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/users/me/profile-picture`, {
    method: 'DELETE',
    headers: buildAuthHeader(),
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.detail ?? 'Could not remove photo. Please try again.');
  }
}
