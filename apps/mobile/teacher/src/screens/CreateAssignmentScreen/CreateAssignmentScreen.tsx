import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { RootStackParamList } from '@/types';
import { styles } from './CreateAssignmentScreen.styles';
import type { CreateAssignmentScreenProps } from './CreateAssignmentScreen.types';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subject: z.string().min(2, 'Subject is required'),
  dueDate: z.string().min(4, 'Due date is required'),
  description: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function CreateAssignmentScreen(_props: CreateAssignmentScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', subject: 'Mathematics', dueDate: 'Jun 20, 2026', description: '' },
  });

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      await mockApi.assignments.create(data);
      Alert.alert('Published', 'Assignment was created successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not publish assignment. Please try again.');
      setSubmitting(false);
    }
  };

  const onInvalid = (formErrors: FieldErrors<Form>) => {
    const firstError = Object.values(formErrors)[0]?.message;
    Alert.alert('Check form', firstError ?? 'Please fill in all required fields.');
  };

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="Create Assignment" />}>
      <View style={styles.body}>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Title"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="subject"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Subject"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.subject?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="dueDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Due Date"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.dueDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Description"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
            />
          )}
        />
      </View>
      <View style={styles.footer}>
        <AppButton
          label="Publish Assignment"
          onPress={handleSubmit(onSubmit, onInvalid)}
          loading={submitting}
          disabled={submitting}
        />
      </View>
    </ScreenLayout>
  );
}
