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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('profile');
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
      setEmailError(t('deleteAccount.emailMismatch'));
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
        setDeleteError(result.error || t('deleteAccount.deleteError'));
        setStep('finalConfirm');
        setIsDeleting(false);
      }
    } catch (error) {
      setDeleteError(t('deleteAccount.unexpectedError'));
      setStep('finalConfirm');
      setIsDeleting(false);
    }
  };

  const renderInitialDialog = () => (
    <View>
      <Dialog.Title style={styles.title}>{t('deleteAccount.title')}</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyLarge" style={styles.warningText}>
          {t('deleteAccount.initialWarning')}
        </Text>
        <Text variant="bodyMedium" style={styles.infoText}>
          {t('deleteAccount.dataWarning')}
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={handleDismiss} textColor={Colors.text.secondary}>
          {t('deleteAccount.cancel')}
        </Button>
        <Button
          onPress={handleInitialConfirm}
          textColor={Colors.error}
          mode="text"
        >
          {t('deleteAccount.continue')}
        </Button>
      </Dialog.Actions>
    </View>
  );

  const renderEmailConfirmDialog = () => (
    <View>
      <Dialog.Title style={styles.title}>{t('deleteAccount.emailConfirmTitle')}</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyLarge" style={styles.warningText}>
          {t('deleteAccount.emailConfirmPrompt')}
        </Text>
        <TextInput
          label={t('deleteAccount.emailLabel')}
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
          {t('deleteAccount.currentAccount')} {userEmail}
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
          {t('deleteAccount.previous')}
        </Button>
        <Button
          onPress={handleEmailConfirm}
          textColor={Colors.error}
          disabled={!emailInput}
        >
          {t('deleteAccount.confirm')}
        </Button>
      </Dialog.Actions>
    </View>
  );

  const renderFinalConfirmDialog = () => (
    <View>
      <Dialog.Title style={[styles.title, styles.dangerTitle]}>
        ⚠️ {t('deleteAccount.finalConfirmTitle')}
      </Dialog.Title>
      <Dialog.Content>
        <Surface style={styles.dangerSurface} elevation={0}>
          <Text variant="bodyLarge" style={styles.dangerText}>
            {t('deleteAccount.irreversibleWarning')}
          </Text>
        </Surface>
        <Text variant="bodyMedium" style={styles.finalWarning}>
          {t('deleteAccount.finalDataWarning')}
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
          {t('deleteAccount.previous')}
        </Button>
        <Button
          onPress={handleFinalConfirm}
          mode="contained"
          buttonColor={Colors.error}
          textColor="#FFFFFF"
          disabled={isDeleting}
          style={styles.deleteButton}
        >
          {t('deleteAccount.deleteButton')}
        </Button>
      </Dialog.Actions>
    </View>
  );

  const renderProcessingDialog = () => (
    <View>
      <Dialog.Title style={styles.title}>{t('deleteAccount.processingTitle')}</Dialog.Title>
      <Dialog.Content>
        <View style={styles.processingContainer}>
          <ActivityIndicator
            animating={true}
            size="large"
            color={Colors.primary.main}
          />
          <Text variant="bodyLarge" style={styles.processingText}>
            {t('deleteAccount.processingMessage')}
          </Text>
          <Text variant="bodySmall" style={styles.processingSubText}>
            {t('deleteAccount.pleaseWait')}
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