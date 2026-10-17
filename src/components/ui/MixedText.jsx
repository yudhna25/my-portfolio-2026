// Sets the `accent` phrase of `text` in the editorial serif italic (see .mix-em).
// The string itself is unchanged, so aria-labels and search keep the plain words.
export function MixedText({ text, accent }) {
  const at = accent ? text.toLocaleLowerCase().indexOf(accent.toLocaleLowerCase()) : -1;
  if (at < 0) return text;
  return <>
    {text.slice(0, at)}
    <em className="mix-em">{text.slice(at, at + accent.length)}</em>
    {text.slice(at + accent.length)}
  </>;
}

export default MixedText;
