// components/ReCaptchaField.tsx
import ReCAPTCHA from "react-google-recaptcha";

export default function ReCaptchaField({
  onChange,
}: {
  onChange: (token: string | null) => void;
}) {
  return (
    <ReCAPTCHA
      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
      size="invisible" // keeps UX clean
      badge="bottomright"
      onChange={onChange}
    />
  );
}
