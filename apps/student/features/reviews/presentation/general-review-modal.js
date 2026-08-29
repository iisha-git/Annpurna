import React, { useState } from 'react';
import { Modal, StyleSheet, TextInput, View, Pressable, Text } from 'react-native';
import { AppText } from '@/shared/ui';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';
import { submitGeneralReview } from '../data/review-repository';
import { Ionicons } from '@expo/vector-icons';

export default function GeneralReviewModal({ visible, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return alert('Please select a rating');
    if (!comment.trim()) return alert('Please leave a comment');
    
    setSubmitting(true);
    const result = await submitGeneralReview(rating, comment);
    setSubmitting(false);
    
    if (result.success) {
      alert('Review submitted! Thank you.');
      setRating(0);
      setComment('');
      onClose();
    } else {
      alert('Failed to submit review.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <AppText variant="h2">Leave a Review</AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textDark} />
            </Pressable>
          </View>
          
          <AppText style={styles.label}>Rate the mess (1-5)</AppText>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Ionicons 
                  name={star <= rating ? 'star' : 'star-outline'} 
                  size={32} 
                  color={colors.accent} 
                />
              </Pressable>
            ))}
          </View>

          <AppText style={styles.label}>Your comment (required)</AppText>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            placeholder="How was the food and hygiene today?"
            placeholderTextColor={colors.muted}
          />
          
          <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.bold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textDark,
    textAlignVertical: 'top',
    height: 100,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  submitBtnText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 16,
  }
});
