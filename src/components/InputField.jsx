export const InputField = ({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  required,
}) => {
  const styles = {
    inputGroup: {
      flex: 1,
      display: "flex",
      flexDirection: "column", // ✅ camelCase instead of flex-direction
      marginBottom: "1rem",
    },
    label: {
      marginBottom: "0.3rem",
      fontWeight: 500,
    },
    input: {
      padding: "0.5rem",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
  };

  return (
    <div style={styles.inputGroup}>
      <label htmlFor={name} style={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={type === "file" ? undefined : value}
        onChange={(e) => {
          if (type === "file") {
            onChange({ target: { name, value: e.target.files[0] } });
          } else {
            onChange(e);
          }
        }}
        required={required}
        style={styles.input}
      />
    </div>
  );
};
