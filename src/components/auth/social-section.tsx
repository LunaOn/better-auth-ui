"use client"

import { useContext } from "react"

import { AuthUIContext } from "../../lib/auth-ui-provider"
import type { AuthView } from "../../lib/auth-view-paths"
import { socialProviders } from "../../lib/social-providers"
import { cn } from "../../lib/utils"
import type { AuthLocalization } from "../../localization/auth-localization"
import type { AuthCardClassNames } from "./auth-card"
import { PasskeyButton } from "./passkey-button"
import { ProviderButton } from "./provider-button"

export interface SocialSectionProps {
    classNames?: AuthCardClassNames
    callbackURL?: string
    isSubmitting: boolean
    localization: AuthLocalization
    redirectTo?: string
    setIsSubmitting: (isSubmitting: boolean) => void
    socialLayout: "horizontal" | "vertical" | "grid"
    view: AuthView
}

export function SocialSection({
    classNames,
    callbackURL,
    isSubmitting,
    localization,
    redirectTo,
    setIsSubmitting,
    socialLayout,
    view
}: SocialSectionProps) {
    const { social, genericOAuth, passkey } = useContext(AuthUIContext)

    // Don't render if view is RESET_PASSWORD or no social options are available
    if (
        view === "RESET_PASSWORD" ||
        (!social?.providers?.length &&
            !genericOAuth?.providers?.length &&
            !(view === "SIGN_IN" && passkey))
    ) {
        return null
    }

    return (
        <div className="grid gap-4">
            {(social?.providers?.length || genericOAuth?.providers?.length) && (
                <div
                    className={cn(
                        "flex w-full items-center justify-between gap-4",
                        socialLayout === "horizontal" && "flex-wrap",
                        socialLayout === "vertical" && "flex-col",
                        socialLayout === "grid" && "grid grid-cols-2"
                    )}
                >
                    {social?.providers?.map((provider) => {
                        const socialProvider = socialProviders.find(
                            (socialProvider) =>
                                socialProvider.provider === provider
                        )
                        if (!socialProvider) return null

                        return (
                            <ProviderButton
                                key={provider}
                                classNames={classNames}
                                callbackURL={callbackURL}
                                isSubmitting={isSubmitting}
                                localization={localization}
                                provider={socialProvider}
                                redirectTo={redirectTo}
                                setIsSubmitting={setIsSubmitting}
                                socialLayout={socialLayout}
                            />
                        )
                    })}

                    {genericOAuth?.providers?.map((provider) => (
                        <ProviderButton
                            key={provider.provider}
                            classNames={classNames}
                            callbackURL={callbackURL}
                            isSubmitting={isSubmitting}
                            localization={localization}
                            provider={provider}
                            redirectTo={redirectTo}
                            setIsSubmitting={setIsSubmitting}
                            socialLayout={socialLayout}
                            other
                        />
                    ))}
                </div>
            )}

            {passkey &&
                [
                    "SIGN_IN",
                    "MAGIC_LINK",
                    "EMAIL_OTP",
                    "RECOVER_ACCOUNT",
                    "TWO_FACTOR",
                    "FORGOT_PASSWORD"
                ].includes(view) && (
                    <PasskeyButton
                        classNames={classNames}
                        isSubmitting={isSubmitting}
                        localization={localization}
                        redirectTo={redirectTo}
                        setIsSubmitting={setIsSubmitting}
                    />
                )}
        </div>
    )
} 