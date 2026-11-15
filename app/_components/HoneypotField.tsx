// A form field people never see or reach, so a real visitor always submits
// it empty — but form-filling bots tend to fill every input they find. The
// server action behind it (submitPremiumInquiry) quietly drops any
// submission where it is filled.
// Moved off-screen rather than display:none, which some bots skip.
export default function HoneypotField() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Leave this field empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
