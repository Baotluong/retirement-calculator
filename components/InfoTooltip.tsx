type InfoTooltipProps = {
  text: string;
};

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className="group/info relative inline-flex">
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-semibold leading-none text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
        aria-label={text}
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-1/2 top-full z-30 mt-2 w-52 -translate-x-1/2 rounded-md bg-zinc-900 px-2.5 py-2 text-left text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/info:visible group-hover/info:opacity-100 group-focus-within/info:visible group-focus-within/info:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
