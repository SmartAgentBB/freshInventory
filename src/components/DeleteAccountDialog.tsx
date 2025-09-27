import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Dialog,
  Portal,
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { accountDeletionService } from '../services/AccountDeletionService';

interface DeleteAccountDialogProps {
  visible: boolean;
  userEmail: string;
  userId: string;
  onDismiss: () => void;
  onDeleteSuccess: () => void;
}

type DialogStep = 'initial' | 'emailConfirm' | 'finalConfirm' | 'processing';

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  visible,
  userEmail,
  userId,
  onDismiss,
  onDeleteSuccess,
}) => {
  const [step, setStep] = useState<DialogStep>('initial');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDismiss = () => {
    if (!isDeleting) {
      setStep('initial');
      setEmailInput('');
      setEmailError('');
      setDeleteError('');
      onDismiss();
    }
  };

  const handleInitialConfirm = () => {
    setStep('emailConfirm');
  };

  const handleEmailConfirm = () => {
    if (emailInput.toLowerCase() !== userEmail.toLowerCase()) {
      setEmailError('입력한 이메일이 일치하지 않습니다.');
      return;
    }
    setEmailError('');
    setStep('finalConfirm');
  };

  const handleFinalConfirm = async () => {
    setStep('processing');
    setIsDeleting(true);
    setDeleteError('');

    try {
      const result = await accountDeletionService.deleteAccount(userId, userEmail);

      if (result.success) {
        onDeleteSuccess();
      } else {
        setDeleteError(result.error || '회원 탈퇴 중 오류가 발생했습니다.');
        setStep('finalConfirm');
        setIsDeleting(false);
      }
    } catch (error) {
      setDeleteError('예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.');
      setStep('finalConfirm');
      setIsDeleting(false);
    }
  };

  const renderInitialDialog = () => (
    <View>
      <Dialog.Title style={styles.title}>회원 탈퇴</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyLarge" style={styles.warningText}>
          정말로 회원 탈퇴를 진행하시겠습니까?
        </Text>
        <Text variant="bodyMedium" style={styles.infoText}>
          회원님의 데이터가 삭제되며, 복구할 수 없습니다.
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={handleDismiss} textColor={Colors.text.secondary}>
          취소
        </Button>
        <Button
          onPress={handleInitialConfirm}
          textColor={Colors.error}
          mode="text"
        >
          계속
        </Button>
      </Dialog.Actions>
    </View>
  );

  const renderEmailConfirmDialog = () => (
    <View>
      <Dialog.Title style={styles.title}>이메일 확인</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyLarge" style={styles.warningText}>
          계정 보호를 위해 이메일을 입력해 주세요.
        </Text>
        <TextInput
          label="이메일 주소"
          value={emailInput}
          onChangeText={setEmailInput}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!emailError}
          style={styles.input}
          outlineColor={Colors.border.medium}
          activeOutlineColor={Colors.primary.main}
        />
        {emailError ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {emailError}
          </Text>
        ) : null}
        <Text variant="bodySmall" style={styles.hintText}>
          현재 로그인된 계정: {userEmail}
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button
          onPress={() => {
            setStep('initial');
            setEmailInput('');
            setEmailError('');
          }}
          textColor={Colors.text.secondary}
        >
          이전
        </Button>
        <Button
          onPress={handleEmailConfirm}
          textColor={Colors.error}
          disabled={!emailInput}
        >
          확인
        </Button>
      </Dialog.Actions>
    </View>
  );

  const renderFinalConfirmDialog = () => (
    <View>
      <Dialog.Title style={[styles.title, styles.dangerTitle]}>
        ⚠️ 최종 확인
      </Dialog.Title>
      <Dialog.Content>
        <Surface style={styles.dangerSurface} elevation={0}>
          <Text variant="bodyLarge" style={styles.dangerText}>
            이 작업은 되돌릴 수 없습니다!
          </Text>
        </Surface>
        <Text variant="bodyMedium" style={styles.finalWarning}>
          회원 탈퇴를 진행하면 모든 개인 데이터가 즉시 삭제되며,
          복구할 수 없습니다.
        </Text>
        <Text variant="bodyMedium" style={styles.finalInfo}>
          같은 이메일로 다시 가입은 가능하지만,
          기존 데이터는 복구되지 않습니다.
        </Text>
        {deleteError ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {deleteError}
          </Text>
        ) : null}
      </Dialog.Content>
      <Dialog.Actions>
        <Button
          onPress={() => {
            setStep('emailConfirm');
            setDeleteError('');
          }}
          textColor={Colors.text.secondary}
          disabled={isDeleting}
        >
          이전
        </Button>
        <Button
          onPress={handleFinalConfirm}
          mode="contained"
          buttonColor={Colors.error}
          textColor="#FFFFFF"
          disabled={isDeleting}
          style={styles.deleteButton}
        >
          회원 탈퇴
        </Button>
      </Dialog.Actions>
    </View>
  );

  const renderProcessingDialog = () => (
    <View>
      <Dialog.Title style={styles.title}>회원 탈퇴 진행 중</Dialog.Title>
      <Dialog.Content>
        <View style={styles.processingContainer}>
          <ActivityIndicator
            animating={true}
            size="large"
            color={Colors.primary.main}
          />
          <Text variant="bodyLarge" style={styles.processingText}>
            회원 탈퇴를 처리하고 있습니다...
          </Text>
          <Text variant="bodySmall" style={styles.processingSubText}>
            잠시만 기다려 주세요.
          </Text>
        </View>
      </Dialog.Content>
    </View>
  );

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
        dismissable={!isDeleting}
        style={styles.dialog}
      >
        {step === 'initial' && renderInitialDialog()}
        {step === 'emailConfirm' && renderEmailConfirmDialog()}
        {step === 'finalConfirm' && renderFinalConfirmDialog()}
        {step === 'processing' && renderProcessingDialog()}
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
  },
  title: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: Colors.text.primary,
  },
  dangerTitle: {
    color: Colors.error,
  },
  warningText: {
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    fontFamily: 'OpenSans-Medium',
  },
  infoText: {
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    fontFamily: 'OpenSans-Regular',
  },
  bulletList: {
    marginLeft: Spacing.md,
    marginVertical: Spacing.sm,
  },
  bulletItem: {
    color: Colors.text.secondary,
    marginVertical: Spacing.xs / 2,
    fontFamily: 'OpenSans-Regular',
  },
  noteText: {
    color: Colors.text.disabled,
    marginTop: Spacing.md,
    fontStyle: 'italic',
    fontFamily: 'OpenSans-Regular',
  },
  input: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.background.default,
  },
  errorText: {
    color: Colors.error,
    marginTop: Spacing.xs,
    fontFamily: 'OpenSans-Regular',
  },
  hintText: {
    color: Colors.text.disabled,
    marginTop: Spacing.xs,
    fontFamily: 'OpenSans-Regular',
  },
  dangerSurface: {
    backgroundColor: `${Colors.error}15`,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  dangerText: {
    color: Colors.error,
    fontFamily: 'OpenSans-SemiBold',
    textAlign: 'center',
  },
  finalWarning: {
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    fontFamily: 'OpenSans-Medium',
  },
  finalInfo: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  deleteButton: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  processingText: {
    marginTop: Spacing.md,
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Medium',
  },
  processingSubText: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
});