"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useContext, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { AuthUIContext } from "../../../lib/auth-ui-provider"
import { cn, getLocalizedError } from "../../../lib/utils"
import { Button } from "../../ui/button"
import { CardContent } from "../../ui/card"
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
import { Skeleton } from "../../ui/skeleton"
import { OTPInputGroup } from "../../auth/otp-input-group"
import { SettingsCard } from "../shared/settings-card"
import type { SettingsCardProps } from "../shared/settings-card"

export function ChangePhoneCard({
    className,
    classNames,
    localization,
    disabled,
    ...props
}: SettingsCardProps & { disabled?: boolean }) {
    const {
        authClient,
        hooks: { useSession },
        localization: contextLocalization,
        toast
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { data: sessionData, isPending, refetch } = useSession()
    const [resendDisabled, setResendDisabled] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [newPhoneNumber, setNewPhoneNumber] = useState<string>("")

    const formSchema = z.object({
        phoneNumber: z
            .string()
            .min(1, { message: localization.PHONE_NUMBER_REQUIRED })
            .regex(/^\+?[1-9]\d{1,14}$/, { message: localization.INVALID_PHONE_NUMBER })
    })

    const otpFormSchema = z.object({
        code: z
            .string()
            .min(1, { message: `${localization.PHONE_OTP} ${localization.IS_REQUIRED}` })
            .length(6, { message: `${localization.PHONE_OTP} ${localization.IS_INVALID}` })
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        values: {
            phoneNumber: (sessionData?.user as any)?.phoneNumber || ""
        }
    })

    const otpForm = useForm({
        resolver: zodResolver(otpFormSchema),
        defaultValues: {
            code: ""
        }
    })

    const resendForm = useForm()

    const { isSubmitting } = form.formState

    const changePhone = async ({ phoneNumber }: z.infer<typeof formSchema>) => {
        if (disabled) return
        
        if (phoneNumber === (sessionData?.user as any)?.phoneNumber) {
            await new Promise((resolve) => setTimeout(resolve))
            toast({
                variant: "error",
                message: localization.PHONE_NUMBER_IS_THE_SAME
            })
            return
        }

        try {
            // Use the Better Auth phone number plugin API
            await authClient.phoneNumber.sendOtp({
                phoneNumber
            })

            setNewPhoneNumber(phoneNumber)
            setIsVerifying(true)
            toast({
                variant: "success",
                message: localization.PHONE_OTP_VERIFICATION_SENT!
            })
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })
        }
    }

    const verifyOTP = async ({ code }: z.infer<typeof otpFormSchema>) => {
        if (disabled) return

        try {
            // Use the Better Auth phone number plugin API with updatePhoneNumber: true
            const isVerified = await authClient.phoneNumber.verify({
                phoneNumber: newPhoneNumber,
                code,
                updatePhoneNumber: true
            })

            if (isVerified) {
                await refetch?.()
                setIsVerifying(false)
                setNewPhoneNumber("")
                otpForm.reset()
                toast({
                    variant: "success",
                    message: `${localization.PHONE_NUMBER} ${localization.UPDATED_SUCCESSFULLY}`
                })
            } else {
                throw new Error('Invalid verification code')
            }
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })
            
            // Reset form and focus
            otpForm.reset({ code: "" })
            setTimeout(() => {
                otpForm.setFocus("code")
            }, 100)
            
            otpForm.setError("code", {
                type: "server",
                message: `${localization.PHONE_OTP} ${localization.IS_INVALID}`
            })
        }
    }



    const resendVerification = async () => {
        if (!sessionData) return
        const phoneNumber = (sessionData.user as any)?.phoneNumber

        setResendDisabled(true)

        try {
            // Use the Better Auth phone number plugin API
            await authClient.phoneNumber.sendOtp({
                phoneNumber
            })

            toast({
                variant: "success",
                message: localization.PHONE_OTP_VERIFICATION_SENT!
            })
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })
            setResendDisabled(false)
            throw error
        }
    }

    if (isVerifying) {
        return (
            <Form {...otpForm}>
                <form noValidate onSubmit={otpForm.handleSubmit(verifyOTP)}>
                    <SettingsCard
                        className={className}
                        classNames={classNames}
                        description={localization.PHONE_OTP_VERIFICATION_SENT}
                        instructions={localization.PHONE_OTP_DESCRIPTION}
                        isPending={isPending}
                        title={localization.PHONE_OTP}
                        disabled={disabled || otpForm.formState.isSubmitting}
                        {...props}
                    >
                        <CardContent className={classNames?.content}>
                            <div className="space-y-4">
                                <FormField
                                    control={otpForm.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{localization.PHONE_OTP}</FormLabel>
                                            <FormControl>
                                                <InputOTP
                                                    {...field}
                                                    maxLength={6}
                                                    onChange={(value) => {
                                                        // Clear server errors when user starts typing
                                                        if (otpForm.formState.errors.code?.type === "server") {
                                                            otpForm.clearErrors("code")
                                                        }
                                                        
                                                        // Update field value
                                                        field.onChange(value)
                                                        
                                                        // Auto-submit when complete
                                                        if (value.length === 6) {
                                                            otpForm.handleSubmit(verifyOTP)()
                                                        }
                                                    }}
                                                    className={classNames?.input}
                                                    disabled={otpForm.formState.isSubmitting || disabled}
                                                >
                                                    <OTPInputGroup otpSeparators={1} />
                                                </InputOTP>
                                            </FormControl>
                                            <FormMessage className={classNames?.error} />
                                        </FormItem>
                                    )}
                                />
                                
                                <Button
                                    type="submit"
                                    disabled={otpForm.formState.isSubmitting || disabled}
                                >
                                    {otpForm.formState.isSubmitting ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        localization.PHONE_OTP_VERIFY_ACTION
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </SettingsCard>
                </form>
            </Form>
        )
    }

    return (
        <>
            <Form {...form}>
                <form noValidate onSubmit={form.handleSubmit(changePhone)}>
                    <SettingsCard
                        className={className}
                        classNames={classNames}
                        description={localization.PHONE_NUMBER_DESCRIPTION}
                        instructions={localization.PHONE_NUMBER_INSTRUCTIONS}
                        isPending={isPending}
                        title={localization.PHONE_NUMBER}
                        actionLabel={localization.SAVE}
                        disabled={disabled}
                        {...props}
                    >
                        <CardContent className={classNames?.content}>
                            {isPending ? (
                                <Skeleton
                                    className={cn(
                                        "h-9 w-full",
                                        classNames?.skeleton
                                    )}
                                />
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    className={
                                                        classNames?.input
                                                    }
                                                    placeholder={
                                                        localization.PHONE_NUMBER_PLACEHOLDER
                                                    }
                                                    type="tel"
                                                    disabled={isSubmitting || disabled}
                                                    {...field}
                                                />
                                            </FormControl>

                                            <FormMessage
                                                className={classNames?.error}
                                            />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </SettingsCard>
                </form>
            </Form>

            {sessionData?.user &&
                (sessionData?.user as any)?.phoneNumber &&
                !(sessionData?.user as any)?.phoneNumberVerified && (
                    <Form {...resendForm}>
                        <form
                            onSubmit={resendForm.handleSubmit(
                                resendVerification
                            )}
                        >
                            <SettingsCard
                                className={className}
                                classNames={classNames}
                                title={localization.VERIFY_YOUR_PHONE}
                                description={
                                    localization.VERIFY_YOUR_PHONE_DESCRIPTION
                                }
                                actionLabel={
                                    localization.RESEND_VERIFICATION_CODE
                                }
                                disabled={resendDisabled}
                                {...props}
                            />
                        </form>
                    </Form>
                )}
        </>
    )
} 