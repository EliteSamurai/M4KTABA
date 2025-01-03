export default function getInitial(value) {
  if (!value) return "";
  // Use the first character of the value
  return value.trim().charAt(0).toUpperCase();
}

