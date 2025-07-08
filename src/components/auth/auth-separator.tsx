"use client"

import { cn } from "../../lib/utils"
import type { AuthLocalization } from "../../localization/auth-localization"
import { Separator } from "../ui/separator"
import type { AuthCardClassNames } from "./auth-card"

export interface AuthSeparatorProps {
    classNames?: AuthCardClassNames
    localization: AuthLocalization
}

export function AuthSeparator({
    classNames,
    localization
}: AuthSeparatorProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2",
                classNames?.continueWith
            )}
        >
            <Separator
                className={cn(
                    "!w-auto grow",
                    classNames?.separator
                )}
            />

            <span className="flex-shrink-0 text-muted-foreground text-sm">
                {localization.OR_CONTINUE_WITH}
            </span>

            <Separator
                className={cn(
                    "!w-auto grow",
                    classNames?.separator
                )}
            />
        </div>
    )
} 