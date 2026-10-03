export default function EnquiryHoneypot() {
  return <label className="form-honeypot" aria-hidden="true">
    Leave this field empty
    <input name="website" type="text" tabIndex={-1} autoComplete="off" />
  </label>;
}
