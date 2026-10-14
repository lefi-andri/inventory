export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={`app-checkbox ${className}`}
        />
    );
}
