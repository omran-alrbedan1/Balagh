import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface SelectOption {
  id: string;
  label: string;
  color?: string;
  sublabel?: string;
}

interface SelectFieldProps {
  label: string;
  onChange: (id: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  placeholder?: string;
  searchable?: boolean;
  value?: string;
}

export function SelectField({
  disabled = false,
  error,
  label,
  loading = false,
  onChange,
  options,
  placeholder = 'Select an option',
  searchable = true,
  value,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.id === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      return [option.label, option.sublabel]
        .filter(Boolean)
        .some((text) => text?.toLowerCase().includes(normalizedQuery));
    });
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, expanded: open }}
        disabled={disabled || loading}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          error ? styles.triggerError : null,
          disabled || loading ? styles.triggerDisabled : null,
        ]}
      >
        <View style={styles.selectedContent}>
          {selected?.color ? (
            <View style={[styles.colorDot, { backgroundColor: selected.color }]} />
          ) : null}
          <Text
            numberOfLines={1}
            style={[styles.selectedText, !selected ? styles.placeholder : null]}
          >
            {loading ? 'Loading...' : selected ? selected.label : placeholder}
          </Text>
        </View>
        <ChevronDown color={colors.primary} size={20} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal animationType="slide" transparent visible={open} onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable
                accessibilityLabel="Close picker"
                accessibilityRole="button"
                onPress={close}
                style={styles.closeButton}
              >
                <X color={colors.primary} size={18} />
              </Pressable>
            </View>

            {searchable ? (
              <View style={styles.searchBox}>
                <Search color={colors.textMuted} size={18} />
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setQuery}
                  placeholder="Search..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  value={query}
                />
              </View>
            ) : null}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.emptyText}>No results found</Text>}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    close();
                  }}
                  style={styles.option}
                >
                  <View style={styles.optionContent}>
                    {item.color ? (
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    ) : null}
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionLabel}>{item.label}</Text>
                      {item.sublabel ? (
                        <Text style={styles.optionSublabel}>{item.sublabel}</Text>
                      ) : null}
                    </View>
                  </View>
                  {item.id === value ? <Check color={colors.primary} size={20} /> : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  colorDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  container: {
    gap: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  option: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingVertical: spacing.sm,
  },
  optionContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  optionSublabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  optionTextWrap: {
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    minHeight: 44,
  },
  selectedContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectedText: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '75%',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  triggerDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.65,
  },
  triggerError: {
    borderColor: colors.danger,
  },
});
