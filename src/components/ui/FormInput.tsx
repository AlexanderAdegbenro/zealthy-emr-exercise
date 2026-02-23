import React, { memo, forwardRef } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

export interface FormInputProps extends TextInputProps {
  label: string;
}

const FormInputInner = memo(
  ({ label, forwardedRef, ...props }: FormInputProps & { forwardedRef: React.Ref<TextInput> }) => (
    <View className="mb-4">
      <Text
        className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-2 ml-1"
        accessibilityElementsHidden={true}
      >
        {label}
      </Text>
      <TextInput
        ref={forwardedRef}
        className="bg-slate-50 border border-papaya_whip-800 p-4 rounded-xl text-base text-slate-900 placeholder:text-slate-400"
        placeholderTextColor="#94a3b8"
        accessibilityLabel={label}
        {...props}
      />
    </View>
  )
);

export const FormInput = forwardRef<TextInput, FormInputProps>((props, ref) => (
  <FormInputInner {...props} forwardedRef={ref} />
));

FormInput.displayName = "FormInput";