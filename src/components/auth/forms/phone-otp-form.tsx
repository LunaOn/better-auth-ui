"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useContext, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useIsHydrated } from "../../../hooks/use-hydrated"
import { useOnSuccessTransition } from "../../../hooks/use-success-transition"
import { AuthUIContext } from "../../../lib/auth-ui-provider"
import { cn, getLocalizedError } from "../../../lib/utils"
import type { AuthLocalization } from "../../../localization/auth-localization"
import { Button } from "../../ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "../../ui/form"
import { Input } from "../../ui/input"
import { InputOTP } from "../../ui/input-otp"
import type { AuthFormClassNames } from "../auth-form"
import { OTPInputGroup } from "../otp-input-group"

export interface PhoneOTPFormProps {
    className?: string
    classNames?: AuthFormClassNames
    callbackURL?: string
    isSubmitting?: boolean
    localization: Partial<AuthLocalization>
    otpSeparators?: 0 | 1 | 2
    /**
     * OTP code length
     * @default 6
     */
    otpLength?: number
    redirectTo?: string
    setIsSubmitting?: (value: boolean) => void
    onOTPPhaseChange?: (isOTPPhase: boolean) => void
}

export function PhoneOTPForm(props: PhoneOTPFormProps) {
    const [phoneNumber, setPhoneNumber] = useState<string | undefined>()

    const handlePhoneNumberSet = (phoneNumber: string) => {
        setPhoneNumber(phoneNumber)
        props.onOTPPhaseChange?.(true)
    }

    const handleGoBackToPhone = () => {
        setPhoneNumber(undefined)
        props.onOTPPhaseChange?.(false)
    }

    if (!phoneNumber) {
        return <PhoneNumberForm {...props} setPhoneNumber={handlePhoneNumberSet} />
    }

    return <OTPForm {...props} phoneNumber={phoneNumber} onGoBack={handleGoBackToPhone} />
}

function PhoneNumberForm({
    className,
    classNames,
    isSubmitting,
    localization,
    setIsSubmitting,
    setPhoneNumber,
    otpLength = 6
}: PhoneOTPFormProps & {
    setPhoneNumber: (phoneNumber: string) => void
}) {
    const isHydrated = useIsHydrated()

    const {
        authClient,
        localization: contextLocalization,
        toast
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const formSchema = z.object({
        phoneNumber: z
            .string()
            .min(1, {
                message: `${localization.PHONE_NUMBER} ${localization.IS_REQUIRED}`
            })
            .regex(/^\+?[1-9]\d{1,14}$/, {
                message: `${localization.PHONE_NUMBER} ${localization.IS_INVALID}`
            })
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            phoneNumber: ""
        }
    })

    isSubmitting = isSubmitting || form.formState.isSubmitting

    useEffect(() => {
        setIsSubmitting?.(form.formState.isSubmitting)
    }, [form.formState.isSubmitting, setIsSubmitting])

    async function sendPhoneOTP({ phoneNumber }: z.infer<typeof formSchema>) {
        try {
            // Use the Better Auth phone number plugin API
            await authClient.phoneNumber.sendOtp({
                phoneNumber
            })

            toast({
                variant: "success",
                message: localization.PHONE_OTP_VERIFICATION_SENT
            })

            setPhoneNumber(phoneNumber)
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(sendPhoneOTP)}
                noValidate={isHydrated}
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={classNames?.label}>
                                {localization.PHONE_NUMBER}
                            </FormLabel>

                            <FormControl>
                                <Input
                                    className={classNames?.input}
                                    type="tel"
                                    placeholder={localization.PHONE_NUMBER_PLACEHOLDER}
                                    disabled={isSubmitting}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage className={classNames?.error} />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                        "w-full",
                        classNames?.button,
                        classNames?.primaryButton
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        localization.PHONE_OTP_SEND_ACTION
                    )}
                </Button>
            </form>
        </Form>
    )
}

export function OTPForm({
    className,
    classNames,
    isSubmitting,
    localization,
    otpSeparators = 0,
    otpLength = 6,
    redirectTo,
    setIsSubmitting,
    phoneNumber,
    onOTPPhaseChange,
    onGoBack
}: PhoneOTPFormProps & {
    phoneNumber: string
    onGoBack: () => void
}) {
    const {
        authClient,
        localization: contextLocalization,
        toast
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
        redirectTo
    })

    const [cooldownSeconds, setCooldownSeconds] = useState(100) // 100 seconds

    // Create a proper validation schema
    const formSchema = z.object({
        code: z
            .string()
            .min(1, {
                message: `${localization.PHONE_OTP} ${localization.IS_REQUIRED}`
            })
            .length(otpLength, {
                message: `${localization.PHONE_OTP} ${localization.IS_INVALID}`
            })
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: ""
        },
        mode: "onSubmit", // Critical: only validate on submit
        reValidateMode: "onSubmit" // Critical: don't revalidate on every change
    })

    isSubmitting =
        isSubmitting || form.formState.isSubmitting || transitionPending

    useEffect(() => {
        setIsSubmitting?.(form.formState.isSubmitting || transitionPending)
    }, [form.formState.isSubmitting, transitionPending, setIsSubmitting])

    // Auto-focus the code field when component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            form.setFocus("code")
        }, 100)
        return () => clearTimeout(timer)
    }, [form])

    // Countdown timer for go back button
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(cooldownSeconds - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldownSeconds])

    const handleGoBack = () => {
        if (cooldownSeconds === 0) {
            onGoBack()
        }
    }

    async function verifyCode({ code }: z.infer<typeof formSchema>) {
        // Only validate exact length when actually submitting
        if (code.length !== otpLength) {
            return // Let zodResolver handle this naturally
        }

        try {
            // Use the Better Auth phone number plugin API
            const isVerified = await authClient.phoneNumber.verify({
                phoneNumber,
                code
            })

            if (isVerified) {
                await onSuccess()
            } else {
                throw new Error('Invalid verification code')
            }
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })

            // The key insight: reset the form completely and let it start fresh
            form.reset({ code: "" })
            
            // Let the form naturally handle the validation state
            setTimeout(() => {
                form.setFocus("code")
            }, 100)

            // Set a specific API error
            form.setError("code", {
                type: "server",
                message: `${localization.PHONE_OTP} ${localization.IS_INVALID}`
            })
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(verifyCode)}
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                <div className="text-sm text-muted-foreground">
                    {localization.PHONE_OTP_VERIFICATION_SENT}
                </div>

                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={classNames?.label}>
                                {localization.PHONE_OTP}
                            </FormLabel>

                            <FormControl>
                                <InputOTP
                                    {...field}
                                    maxLength={otpLength}
                                    onChange={(value) => {
                                        // Clear server errors when user starts typing
                                        if (form.formState.errors.code?.type === "server") {
                                            form.clearErrors("code")
                                        }
                                        
                                        // Update field value
                                        field.onChange(value)
                                        
                                        // Auto-submit when complete
                                        if (value.length === otpLength) {
                                            form.handleSubmit(verifyCode)()
                                        }
                                    }}
                                    containerClassName={
                                        classNames?.otpInputContainer
                                    }
                                    className={classNames?.otpInput}
                                    disabled={isSubmitting}
                                >
                                    <OTPInputGroup
                                        otpSeparators={otpSeparators}
                                    />
                                </InputOTP>
                            </FormControl>

                            <FormMessage className={classNames?.error} />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                            classNames?.button,
                            classNames?.primaryButton
                        )}
                    >
                        {isSubmitting && <Loader2 className="animate-spin" />}
                        {localization.PHONE_OTP_VERIFY_ACTION}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting || cooldownSeconds > 0}
                        onClick={handleGoBack}
                        className={cn(
                            classNames?.button,
                            classNames?.outlineButton
                        )}
                    >
                        {cooldownSeconds > 0 ? (
                            `${localization.GO_BACK} (${cooldownSeconds})`
                        ) : (
                            localization.GO_BACK
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
} 