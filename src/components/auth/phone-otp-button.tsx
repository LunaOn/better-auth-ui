import { LockIcon, SmartphoneIcon } from "lucide-react"
import { useContext } from "react"

import { AuthUIContext } from "../../lib/auth-ui-provider"
import type { AuthView } from "../../lib/auth-view-paths"
import { cn } from "../../lib/utils"
import type { AuthLocalization } from "../../localization/auth-localization"
import { Button } from "../ui/button"
import type { AuthCardClassNames } from "./auth-card"

interface PhoneOTPButtonProps {
    classNames?: AuthCardClassNames
    isSubmitting?: boolean
    localization: Partial<AuthLocalization>
    view: AuthView
}

export function PhoneOTPButton({
    classNames,
    isSubmitting,
    localization,
    view
}: PhoneOTPButtonProps) {
    const { viewPaths, navigate, basePath } = useContext(AuthUIContext)

    return (
        <Button
            className={cn(
                "w-full",
                classNames?.form?.button,
                classNames?.form?.secondaryButton
            )}
            disabled={isSubmitting}
            type="button"
            variant="secondary"
            onClick={() =>
                navigate(
                    `${basePath}/${view === "PHONE_OTP" ? viewPaths.SIGN_IN : viewPaths.PHONE_OTP}${window.location.search}`
                )
            }
        >
            {view === "PHONE_OTP" ? (
                <LockIcon className={classNames?.form?.icon} />
            ) : (
                <SmartphoneIcon className={classNames?.form?.icon} />
            )}
            {localization.SIGN_IN_WITH}{" "}
            {view === "PHONE_OTP"
                ? localization.PASSWORD
                : localization.PHONE_OTP}
        </Button>
    )
} 