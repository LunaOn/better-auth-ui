"use client"

import { useContext } from "react"

import { useAuthenticate } from "../../hooks/use-authenticate"
import { AuthUIContext } from "../../lib/auth-ui-provider"
import { cn, getAuthViewByPath } from "../../lib/utils"
import type { AuthLocalization } from "../../localization/auth-localization"
import { OrganizationInvitationsCard } from "../organization/organization-invitations-card"
import { OrganizationMembersCard } from "../organization/organization-members-card"
import { OrganizationSettingsCards } from "../organization/organization-settings-cards"
import { OrganizationsCard } from "../organization/organizations-card"
import { Button } from "../ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { AccountSettingsCards } from "./account-settings-cards"
import { APIKeysCard } from "./api-key/api-keys-card"
import { SecuritySettingsCards } from "./security-settings-cards"
import type { SettingsCardClassNames } from "./shared/settings-card"

export type SettingsCardsClassNames = {
    base?: string
    card?: SettingsCardClassNames
    cards?: string
    icon?: string
    tabs?: {
        base?: string
        list?: string
        trigger?: string
        content?: string
    }
    sidebar?: {
        base?: string
        button?: string
        buttonActive?: string
    }
}

export const settingsViews = [
    "SETTINGS",
    "SECURITY",
    "API_KEYS",
    "ORGANIZATION",
    "ORGANIZATIONS",
    "MEMBERS"
] as const
export type SettingsView = (typeof settingsViews)[number]

interface NavigationItem {
    view: SettingsView
    label?: string
}

export interface SettingsCardsProps {
    className?: string
    classNames?: SettingsCardsClassNames
    localization?: AuthLocalization
    pathname?: string
    view?: SettingsView
}

export function SettingsCards({
    className,
    classNames,
    localization,
    pathname,
    view
}: SettingsCardsProps) {
    useAuthenticate()

    const {
        apiKey,
        basePath,
        localization: contextLocalization,
        organization,
        settings,
        viewPaths,
        Link
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    // Determine view from pathname if provided
    const path = pathname?.split("/").pop()
    view =
        view ||
        (getAuthViewByPath(viewPaths, path) as SettingsView) ||
        "SETTINGS"

    // Personal settings group
    const personalGroup: NavigationItem[] = [
        {
            view: "SETTINGS",
            label: localization.ACCOUNT
        },
        {
            view: "SECURITY",
            label: localization.SECURITY
        }
    ]

    if (apiKey) {
        personalGroup.push({
            view: "API_KEYS",
            label: localization.API_KEYS
        })
    }

    if (organization) {
        personalGroup.push({
            view: "ORGANIZATIONS",
            label: localization.ORGANIZATIONS
        })
    }

    // Organization settings group
    const organizationGroup: NavigationItem[] = []

    if (organization) {
        organizationGroup.push({
            view: "ORGANIZATION",
            label: localization.ORGANIZATION
        })

        organizationGroup.push({
            view: "MEMBERS",
            label: localization.MEMBERS
        })
    }

    // Determine which group the current view belongs to
    const isPersonalView = personalGroup.some((item) => item.view === view)
    const isOrganizationView =
        organizationGroup.some((item) => item.view === view) ||
        view === "MEMBERS"

    // Show navigation for the current group
    const currentNavigationGroup = isOrganizationView
        ? organizationGroup
        : personalGroup

    // Flatten all items for finding current item
    const currentItem = currentNavigationGroup.find(
        (item) => item.view === view
    )

    return (
        <div
            className={cn(
                "flex w-full grow flex-col gap-4 md:flex-row md:gap-12",
                className,
                classNames?.base
            )}
        >
            {/* Mobile: Tabs Layout */}
            <div className="md:hidden">
                <Tabs 
                    value={view} 
                    className={cn(classNames?.tabs?.base)}
                    onValueChange={(value) => {
                        const targetView = value as SettingsView
                        const targetPath = `${settings?.basePath || basePath}/${viewPaths[targetView]}`
                        window.location.href = targetPath
                    }}
                >
                    <TabsList className={cn("grid w-full", classNames?.tabs?.list)} style={{
                        gridTemplateColumns: `repeat(${currentNavigationGroup.length}, 1fr)`
                    }}>
                        {currentNavigationGroup.map((item) => (
                            <TabsTrigger 
                                key={item.view}
                                value={item.view}
                                className={cn(
                                    "text-xs",
                                    classNames?.tabs?.trigger
                                )}
                            >
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {currentNavigationGroup.map((item) => (
                        <TabsContent 
                            key={item.view} 
                            value={item.view}
                            className={cn(
                                "mt-4",
                                classNames?.tabs?.content
                            )}
                        >
                            {item.view === "SETTINGS" && (
                                <AccountSettingsCards
                                    classNames={classNames}
                                    localization={localization}
                                />
                            )}

                            {item.view === "SECURITY" && (
                                <SecuritySettingsCards
                                    classNames={classNames}
                                    localization={localization}
                                />
                            )}

                            {item.view === "API_KEYS" && apiKey && (
                                <div className={cn("flex w-full flex-col", classNames?.cards)}>
                                    <APIKeysCard
                                        classNames={classNames?.card}
                                        localization={localization}
                                    />
                                </div>
                            )}

                            {item.view === "ORGANIZATION" && organization && (
                                <OrganizationSettingsCards
                                    classNames={classNames}
                                    localization={localization}
                                />
                            )}

                            {item.view === "ORGANIZATIONS" && organization && (
                                <div className={cn("flex w-full flex-col", classNames?.cards)}>
                                    <OrganizationsCard
                                        classNames={classNames?.card}
                                        localization={localization}
                                    />
                                </div>
                            )}

                            {item.view === "MEMBERS" && organization && (
                                <div
                                    className={cn(
                                        "flex w-full flex-col gap-4 md:gap-6",
                                        classNames?.cards
                                    )}
                                >
                                    <OrganizationMembersCard
                                        classNames={classNames?.card}
                                        localization={localization}
                                    />

                                    <OrganizationInvitationsCard
                                        classNames={classNames?.card}
                                        localization={localization}
                                    />
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Desktop: Sidebar Layout */}
            <div className="hidden md:block">
                <div
                    className={cn(
                        "flex w-60 flex-col gap-1",
                        classNames?.sidebar?.base
                    )}
                >
                    {currentNavigationGroup.map((item) => (
                        <Link
                            key={item.view}
                            href={`${settings?.basePath || basePath}/${viewPaths[item.view]}`}
                        >
                            <Button
                                size="lg"
                                className={cn(
                                    "w-full justify-start px-4 transition-none",
                                    classNames?.sidebar?.button,
                                    view === item.view
                                        ? "font-semibold"
                                        : "text-foreground/70",
                                    view === item.view &&
                                        classNames?.sidebar?.buttonActive
                                )}
                                variant="ghost"
                            >
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Desktop: Content Area */}
            <div className="hidden md:block w-full">
                {view === "SETTINGS" && (
                    <AccountSettingsCards
                        classNames={classNames}
                        localization={localization}
                    />
                )}

                {view === "SECURITY" && (
                    <SecuritySettingsCards
                        classNames={classNames}
                        localization={localization}
                    />
                )}

                {view === "API_KEYS" && apiKey && (
                    <div className={cn("flex w-full flex-col", classNames?.cards)}>
                        <APIKeysCard
                            classNames={classNames?.card}
                            localization={localization}
                        />
                    </div>
                )}

                {view === "ORGANIZATION" && organization && (
                    <OrganizationSettingsCards
                        classNames={classNames}
                        localization={localization}
                    />
                )}

                {view === "ORGANIZATIONS" && organization && (
                    <div className={cn("flex w-full flex-col", classNames?.cards)}>
                        <OrganizationsCard
                            classNames={classNames?.card}
                            localization={localization}
                        />
                    </div>
                )}

                {view === "MEMBERS" && organization && (
                    <div
                        className={cn(
                            "flex w-full flex-col gap-4 md:gap-6",
                            classNames?.cards
                        )}
                    >
                        <OrganizationMembersCard
                            classNames={classNames?.card}
                            localization={localization}
                        />

                        <OrganizationInvitationsCard
                            classNames={classNames?.card}
                            localization={localization}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
