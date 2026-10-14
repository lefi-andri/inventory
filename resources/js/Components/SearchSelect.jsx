import Select from 'react-select';

export default function SearchSelect({
    options,
    value,
    onChange,
    placeholder = 'Pilih opsi',
    searchPlaceholder = 'Ketik untuk mencari...',
    noOptionsMessage = 'Tidak ada hasil',
    isClearable = false,
    ...props
}) {
    const selectedOption = options.find((option) => String(option.value) === String(value)) || null;

    return (
        <Select
            {...props}
            unstyled
            options={options}
            value={selectedOption}
            onChange={(option) => onChange(option?.value ?? '')}
            placeholder={placeholder}
            isClearable={isClearable}
            isSearchable
            openMenuOnFocus
            aria-label={props['aria-label'] || placeholder}
            inputId={props.inputId}
            screenReaderStatus={({ count }) => `${count} pilihan tersedia`}
            noOptionsMessage={({ inputValue }) => inputValue ? `${noOptionsMessage} untuk “${inputValue}”` : noOptionsMessage}
            ariaLiveMessages={{ guidance: () => searchPlaceholder }}
            classNames={{
                control: ({ isFocused, isDisabled }) => `min-h-10 rounded-xl border bg-white text-sm shadow-sm transition ${isFocused ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'} ${isDisabled ? 'cursor-not-allowed bg-slate-100 opacity-60' : ''}`,
                valueContainer: () => 'px-3 py-1',
                placeholder: () => 'text-slate-400',
                singleValue: () => 'text-slate-900',
                input: () => 'text-slate-900',
                indicatorsContainer: () => 'px-2 text-slate-500',
                indicatorSeparator: () => 'hidden',
                dropdownIndicator: ({ selectProps }) => `transition ${selectProps.menuIsOpen ? 'rotate-180' : ''}`,
                clearIndicator: () => 'hover:text-red-600',
                menu: () => 'z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl',
                menuList: () => 'max-h-60 p-1',
                option: ({ isFocused, isSelected }) => `cursor-pointer rounded-lg px-3 py-2 text-sm ${isSelected ? 'bg-blue-600 text-white' : isFocused ? 'bg-blue-50 text-blue-900' : 'text-slate-700'}`,
                noOptionsMessage: () => 'px-3 py-6 text-sm text-slate-500',
            }}
        />
    );
}
