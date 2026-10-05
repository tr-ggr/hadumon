import { Field, type FieldProps } from "~/components/ui";

export interface PasswordFieldProps extends Omit<
  FieldProps,
  "type" | "trailing"
> {
  /** Whether what is typed can be read. */
  visible: boolean;
  /** Given, the field carries the Show / Hide control at its right end. */
  onToggleVisible?: () => void;
}

/**
 * A password slot. The form holds `visible`, so one Show control can uncover
 * a password and its retype together.
 */
export function PasswordField({
  visible,
  onToggleVisible,
  ...props
}: PasswordFieldProps) {
  return (
    <Field
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      spellCheck={false}
      trailing={
        onToggleVisible ? (
          <button
            type="button"
            onClick={onToggleVisible}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="min-h-10 min-w-12 px-2 text-xs font-black underline underline-offset-2"
          >
            {visible ? "Hide" : "Show"}
          </button>
        ) : undefined
      }
      {...props}
    />
  );
}
