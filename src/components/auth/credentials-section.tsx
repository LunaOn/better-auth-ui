"use client"

import { useContext } from "react"

import { AuthUIContext } from "../../lib/auth-ui-provider"
import type { AuthView } from "../../lib/auth-view-paths"
import type { AuthLocalization } from "../../localization/auth-localization"
import type { AuthCardClassNames } from "./auth-card"
import { AuthForm } from "./auth-form"
import { EmailOTPButton } from "./email-otp-button"
import { MagicLinkButton } from "./magic-link-button"
import { PhoneOTPButton } from "./phone-otp-button"

export interface CredentialsSectionProps {
    classNames?: AuthCardClassNames
    callbackURL?: string
    isSubmitting: boolean
    localization: AuthLocalization
    otpSeparators: 0 | 1 | 2
    otpLength?: number
    pathname?: string
    redirectTo?: string
    setIsSubmitting: (isSubmitting: boolean) => void
    view: AuthView
    onOTPPhaseChange?: (isOTPPhase: boolean) => void
}

export function CredentialsSection({
    classNames,
    callbackURL,
    isSubmitting,
    localization,
    otpSeparators,
    otpLength = 6,
    pathname,
    redirectTo,
    setIsSubmitting,
    view,
    onOTPPhaseChange
}: CredentialsSectionProps) {
    const { credentials, magicLink, emailOTP, phoneOTP } = useContext(AuthUIContext)

    // Don't render if none of the credential options are enabled
    if (!credentials && !magicLink && !emailOTP && !phoneOTP) {
        return null
    }

    return (
        <div className="grid gap-4">
            <AuthForm
                classNames={classNames?.form}
                callbackURL={callbackURL}
                isSubmitting={isSubmitting}
                localization={localization}
                otpSeparators={otpSeparators}
                otpLength={otpLength}
                pathname={pathname}
                redirectTo={redirectTo}
                setIsSubmitting={setIsSubmitting}
                onOTPPhaseChange={onOTPPhaseChange}
            />

            {magicLink &&
                ((credentials &&
                    [
                        "FORGOT_PASSWORD",
                        "SIGN_UP",
                        "SIGN_IN",
                        "MAGIC_LINK",
                        "EMAIL_OTP"
                    ].includes(view)) ||
                    (emailOTP && view === "EMAIL_OTP")) && (
                    <MagicLinkButton
                        classNames={classNames}
                        localization={localization}
                        view={view}
                        isSubmitting={isSubmitting}
                    />
                )}

            {emailOTP &&
                ((credentials &&
                    [
                        "FORGOT_PASSWORD",
                        "SIGN_UP",
                        "SIGN_IN",
                        "MAGIC_LINK",
                        "EMAIL_OTP"
                    ].includes(view)) ||
                    (magicLink &&
                        ["SIGN_IN", "MAGIC_LINK"].includes(view))) && (
                    <EmailOTPButton
                        classNames={classNames}
                        localization={localization}
                        view={view}
                        isSubmitting={isSubmitting}
                    />
                )}

            {phoneOTP && (
                    <PhoneOTPButton
                        classNames={classNames}
                        localization={localization}
                        view={view}
                        isSubmitting={isSubmitting}
                    />
                )}
        </div>
    )
} 