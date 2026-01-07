type Props = {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
};

export default function NumberField(props: Props) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">{props.label}</span>
            <input
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                type="number"
                min={props.min ?? 0}
                value={Number.isFinite(props.value) ? props.value : 0}
                onChange={(e) => props.onChange(Number(e.target.value))}
            />
        </label>
    );
}
