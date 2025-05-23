import { effect19a } from './TextField.effect'
import { tw } from 'woby-styled'
import { ObservableMaybe, $$, $, type JSX, isObservable, Observable } from 'woby'
import { EventHandler, TargetedEvent, TargetedInputEvent } from 'woby/dist/types/types'

//https://codepen.io/maheshambure21/pen/EozKKy

/**
 * @param reactive On = commit on enter, off(default) = commit on key up
 *
 *
 *
 * To change Line color, patch the following class into effect
 *
 * top line: [&\~span]:before:bg-[#4caf50]
 *
 * bottom line: [&\~span]:after:bg-[#4caf50]
 *
 * left line: [&\~span_i]:before:bg-[#4caf50]
 *
 * right line: [&\~span_i]:after:bg-[#4caf50]
 *
 * Placeholder text: text-[color] text-*
 *
 * With content text: [&:not(:placeholder-shown)]:text-[red]
 *
 * box: border-[#ccc]
 *
 * Fill color: [&\~span]:bg-[#ededed]
 *
 * Fill color (focused) : [&:focus\~span]:bg-[#ededed]
 *
 * label text: [&\~label]:text-[red] [&:focus\~label]:text-[red] [&:not(:placeholder-shown)~label]:text-[red]
 */

type TextFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
	children?: JSX.Child
	effect?: JSX.Class
	assignOnEnter?: ObservableMaybe<boolean>
}
export const TextField = (props: TextFieldProps): JSX.Element => {
	const { className, class: cls, children, effect, assignOnEnter, value, type = "text", placeholder = "Placeholder Text", onChange, onKeyUp, size, ...otherProps } = props

	return (
		<div class={[className ?? cls ?? "m-[20px]", "relative"]}>
			<input
				class={effect ?? effect19a}
				value={value}
				{...{ ...otherProps, type, placeholder }}
				onChange={(e) => {
					!$$(assignOnEnter) && isObservable(value) ? (value?.(e.target.value), onChange?.(e)) : undefined
				}}
				onKeyUp={(e) => {
					!$$(assignOnEnter) && isObservable(value) ? (value?.(e.target.value), onKeyUp?.(e)) : (e.key === "Enter" && isObservable(value) && value(e.target.value), onKeyUp?.(e))
				}}
				size={size ?? 40}
			/>
			{children}
		</div>
	)
}

export const StartAdornment = tw("div")`flex h-[0.01em] max-h-[2em] items-center whitespace-nowrap text-[rgba(0,0,0,0.54)] mr-2`
export const EndAdornment = tw("div")`flex h-[0.01em] max-h-[2em] items-center whitespace-nowrap text-[rgba(0,0,0,0.54)] ml-2`
