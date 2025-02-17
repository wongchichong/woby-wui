import { $, $$, useEffect, isObservable, ObservableMaybe, type JSX } from "woby"

const btn = `
bg-transparent items-center justify-center cursor-pointer relative m-0 border-[none] [outline:none] [-webkit-appearance:none]
disabled:bg-[#d9dbda]
`
//w-12 h-12
// before:inline-block before:absolute before:content-[''] before:w-4 h-0.5 before:bg-[#212121] before:-translate-x-2/4 before:-translate-y-2/4
// after:inline-block after:absolute after:content-[''] after:w-4 h-0.5 after:bg-[#212121] after:-translate-x-2/4 after:-translate-y-2/4

type NumberFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
	children?: JSX.Child
	reactive?: ObservableMaybe<boolean>
	noMinMax?: ObservableMaybe<boolean>
}

export const NumberField = (props: NumberFieldProps): JSX.Element => {
	const { className, class: cls, children, onChange, noMinMax, onKeyUp, reactive, ...otherProps } = props
	const { min, max, value, disabled } = otherProps
	const inputRef = $<HTMLInputElement>()
	const error = () => $$(value) < $$(min) || $$(value) > $$(max)
	const checkMinValue = () => $$(value) <= $$(min)
	const checkMaxValue = () => $$(value) >= $$(max)

	useEffect(() => {
		if ($$(noMinMax)) return

		if ($$(value) < $$(min)) isObservable(value) && value($$(min))

		if ($$(value) > $$(max)) isObservable(value) && value($$(max))
	})

	return (
		<div class={["number-input inline-flex border-2 border-solid border-[#ddd] box-border [&_*]:box-border", className, cls]}>
			<button
				class={btn}
				onClick={(e) => {
					e.stopImmediatePropagation()
					$$(inputRef).stepDown()
					isObservable(value) && value?.($$(inputRef).valueAsNumber)
					//@ts-ignore TODO
					// onChange?.($$(inputRef))
				}}
				disabled={() => checkMinValue() || disabled}
			>
				-
			</button>
			<input
				ref={inputRef}
				class={[
					`quantity  [-webkit-appearance:textfield] [-moz-appearance:textfield] [appearance:textfield]
        [&::-webkit-inner-spin-button]:[-webkit-appearance:none] [&::-webkit-outer-spin-button]:[-webkit-appearance:none]
        text-center p-2 border-solid border-[0_2px]
        `,
					() => ($$(error) ? "text-[red]" : ""),
				]}
				type="number"
				value={value}
				{...otherProps}
				onChange={(e) => {
					!$$(reactive) && isObservable(value) ? (value?.(e.target.valueAsNumber), onChange?.(e)) : onChange?.(e)
				}}
				onKeyUp={(e) => {
					!$$(reactive) && isObservable(value) ? (value?.(e.target.valueAsNumber), onKeyUp?.(e)) : onKeyUp?.(e)
				}}
				onWheel={(e) => {
					e.preventDefault()
					!$$(reactive) && isObservable(value) ? value?.(Math.sign(e.deltaY) > 0 ? ++e.target.value : --e.target.value) : undefined
				}}
				disabled={disabled}
			/>
			<button
				class={[btn, "plus"]}
				onClick={(e) => {
					e.stopImmediatePropagation()
					$$(inputRef).stepUp()
					isObservable(value) && value?.($$(inputRef).valueAsNumber)
					//@ts-ignore TODO
					// onChange?.($$(inputRef))
				}}
				disabled={() => checkMaxValue() || disabled}
			>
				+
			</button>
		</div>
	)
}
