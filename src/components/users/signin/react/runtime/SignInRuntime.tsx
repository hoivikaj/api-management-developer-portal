import * as React from "react";
import { useEffect, useState } from "react";
import { FluentProvider, Spinner } from "@fluentui/react-components";
import { Resolve } from "@paperbits/react/decorators";
import { Router } from "@paperbits/common/routing";
import { EventManager } from "@paperbits/common/events";
import { UsersService } from "../../../../../services/usersService";
import { RouteHelper } from "../../../../../routing/routeHelper";
import { Utils } from "../../../../../utils";
import { fuiTheme } from "../../../../../constants";
import { SignInForm, THandleSignIn } from "./SignInForm";

type SignInRuntimeProps = {
    delegationUrl: string
    termsEnabled: boolean
    termsOfUse: string
    isConsentRequired: boolean
}
type SignInRuntimeFCProps = SignInRuntimeProps & {
    usersService: UsersService
    eventManager: EventManager
    handleSignIn: THandleSignIn
};

const initUser = async (usersService: UsersService, redirectUrl: string) => {
    let userId: string;
    try {
        userId = await usersService.getCurrentUserId();
    } catch (error) {
        // those errors are expected
        if (error.code !== "Unauthorized" && error.code !== "ResourceNotFound") throw error;
    }

    if (userId) {
        usersService.navigateToHome();
    } else if (redirectUrl) {
        location.assign(redirectUrl);
    }
};

const SignInRuntimeFC = ({ usersService, eventManager, handleSignIn, delegationUrl }: SignInRuntimeFCProps) => {
    const [working, setWorking] = useState(true);

    useEffect(() => {
        setWorking(true);
        initUser(usersService, delegationUrl)
            .finally(() => setWorking(false));
    }, [usersService, delegationUrl]);

    if (working) return <Spinner label={"Loading current user..."} labelPosition="below" size="small" />;

    return (
        <SignInForm eventManager={eventManager} handleSignIn={handleSignIn}  />
    );
};

export class SignInRuntime extends React.Component<SignInRuntimeProps> {
    @Resolve("usersService")
    public declare usersService: UsersService;

    @Resolve("eventManager")
    public declare eventManager: EventManager;

    @Resolve("routeHelper")
    public declare routeHelper: RouteHelper;

    @Resolve("router")
    public declare router: Router;

    handleSignIn = async (email: string, password: string) => {
        const clientReturnUrl = sessionStorage.getItem("returnUrl");
        const returnUrl = this.routeHelper.getQueryParameter("returnUrl") || clientReturnUrl;

        await this.usersService.signInWithBasic(email, password);

        if (returnUrl) {
            return await this.router.navigateTo(Utils.sanitizeReturnUrl(returnUrl));
        } else {
            return this.usersService.navigateToHome();
        }
    }

    render() {
        return (
            <FluentProvider theme={fuiTheme}>
                <SignInRuntimeFC
                    {...this.props}
                    usersService={this.usersService}
                    eventManager={this.eventManager}
                    handleSignIn={this.handleSignIn.bind(this)}
                />
            </FluentProvider>
        );
    }
}
