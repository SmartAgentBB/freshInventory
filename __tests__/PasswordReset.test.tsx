import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { ForgotPasswordScreen } from '../src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../src/screens/ResetPasswordScreen';
import { supabaseClient } from '../src/services/supabaseClient';
import { mintLightTheme } from '../src/theme/mintTheme';

// Mock supabase client
jest.mock('../src/services/supabaseClient', () => ({
  supabaseClient: {
    auth: {
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <PaperProvider theme={mintLightTheme}>
      {component}
    </PaperProvider>
  );
};

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = renderWithTheme(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    expect(getByText('비밀번호 찾기')).toBeTruthy();
    expect(getByPlaceholderText('이메일')).toBeTruthy();
    expect(getByText('재설정 링크 보내기')).toBeTruthy();
  });

  it('shows error when email is empty', async () => {
    const { getByText } = renderWithTheme(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const submitButton = getByText('재설정 링크 보내기');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('이메일을 입력해주세요')).toBeTruthy();
    });
  });

  it('shows error when email is invalid', async () => {
    const { getByPlaceholderText, getByText } = renderWithTheme(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('이메일');
    fireEvent.changeText(emailInput, 'invalid-email');

    const submitButton = getByText('재설정 링크 보내기');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('올바른 이메일 주소를 입력해주세요')).toBeTruthy();
    });
  });

  it('successfully sends reset password email', async () => {
    (supabaseClient.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: null,
    });

    const { getByPlaceholderText, getByText } = renderWithTheme(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('이메일');
    fireEvent.changeText(emailInput, 'test@example.com');

    const submitButton = getByText('재설정 링크 보내기');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'com.smartagent.nengpro://reset-password' }
      );
      expect(getByText(/비밀번호 재설정 링크가 이메일로 전송되었습니다/)).toBeTruthy();
    });
  });

  it('shows error when reset password fails', async () => {
    (supabaseClient.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: { message: 'User not found' },
    });

    const { getByPlaceholderText, getByText } = renderWithTheme(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('이메일');
    fireEvent.changeText(emailInput, 'notfound@example.com');

    const submitButton = getByText('재설정 링크 보내기');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('등록되지 않은 이메일입니다')).toBeTruthy();
    });
  });
});

describe('ResetPasswordScreen', () => {
  const mockRoute = { params: {} };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'valid-token' } },
    });
  });

  it('renders correctly', () => {
    const { getByText, getAllByPlaceholderText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('비밀번호 재설정')).toBeTruthy();
    expect(getAllByPlaceholderText(/비밀번호/).length).toBeGreaterThan(0);
    expect(getByText('비밀번호 변경하기')).toBeTruthy();
  });

  it('shows error when passwords are empty', async () => {
    const { getByText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    const submitButton = getByText('비밀번호 변경하기');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('새 비밀번호를 입력해주세요')).toBeTruthy();
    });
  });

  it('shows error when password is too short', async () => {
    const { getByPlaceholderText, getByText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    const newPasswordInput = getByPlaceholderText('새 비밀번호');
    const confirmPasswordInput = getByPlaceholderText('비밀번호 확인');

    fireEvent.changeText(newPasswordInput, '12345');
    fireEvent.changeText(confirmPasswordInput, '12345');

    const submitButton = getByText('비밀번호 변경하기');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('비밀번호는 최소 6자 이상이어야 합니다')).toBeTruthy();
    });
  });

  it('shows error when passwords do not match', async () => {
    const { getByPlaceholderText, getByText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    const newPasswordInput = getByPlaceholderText('새 비밀번호');
    const confirmPasswordInput = getByPlaceholderText('비밀번호 확인');

    fireEvent.changeText(newPasswordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password456');

    const submitButton = getByText('비밀번호 변경하기');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('비밀번호가 일치하지 않습니다')).toBeTruthy();
    });
  });

  it('successfully resets password', async () => {
    (supabaseClient.auth.updateUser as jest.Mock).mockResolvedValue({
      error: null,
    });

    const { getByPlaceholderText, getByText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    const newPasswordInput = getByPlaceholderText('새 비밀번호');
    const confirmPasswordInput = getByPlaceholderText('비밀번호 확인');

    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmPasswordInput, 'newpassword123');

    const submitButton = getByText('비밀번호 변경하기');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(supabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
      expect(getByText(/비밀번호가 성공적으로 변경되었습니다/)).toBeTruthy();
    });
  });

  it('shows error when session is invalid', async () => {
    (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    const { getByText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(
        getByText(/비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다/)
      ).toBeTruthy();
    });
  });
});
