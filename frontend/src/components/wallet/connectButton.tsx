import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Shield, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LoaderCircle } from 'lucide-react';
import { useDAppConnector } from './client-providers';


export const WalletConnect = () => {
    const { dAppConnector, refresh } = useDAppConnector() ?? {};
    const navigate = useNavigate()
    const [isConnecting, setIsConnecting] = useState(false);


    const handleConnectWallet = async (role: 'patient' | 'provider') => {
        try {
            console.log("Connecting")
            toast({ title: "Please wait", description: `Trying to connect as a ${role}` });
            setIsConnecting(true);
            if (dAppConnector) {
                console.log("ABout to connect")
                await dAppConnector.openModal();
                if (refresh) refresh();
            }
            toast({ title: "Wallet Connected", description: `Connected as ${role}` });
        }
        catch (error) {
            console.error("error: ", error);
        }
        finally {
            navigate(role === "patient" ? '/dashboard' : '/providers/dashboard')
            setIsConnecting(true);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto p-4">
            <Card className="card-3d border-2 hover:border-medical-green/30 transition-all duration-500">
                <CardHeader className="text-center pb-8">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-medical-soft to-medical-green rounded-full flex items-center justify-center mb-6 card-float">
                        <Shield className="w-12 h-12 text-medical-deep" />
                    </div>
                    <CardTitle className="text-3xl font-display text-foreground">
                        Patient Portal
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        Access your encrypted medical records securely
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-medical-green" />
                            <span>Control your medical data</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-medical-green" />
                            <span>Grant & revoke provider access</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-medical-green" />
                            <span>Blockchain-verified records</span>
                        </div>
                    </div>
                    <Button size="lg" className="w-full" onClick={() => { handleConnectWallet('patient') }} disabled={isConnecting}>
                        <Wallet className="w-5 h-5" />
                        {isConnecting ? <LoaderCircle /> : 'Connect as Patient'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="card-3d border-2 hover:border-medical-bright/30 transition-all duration-500">
                <CardHeader className="text-center pb-8">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-accent/20 to-accent rounded-full flex items-center justify-center mb-6 card-float">
                        <Shield className="w-12 h-12 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-3xl font-display text-foreground">
                        Healthcare Provider
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        Access patient records with proper consent
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-accent" />
                            <span>Consent-based data access</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-accent" />
                            <span>Add new medical records</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-accent" />
                            <span>Verified provider credentials</span>
                        </div>
                    </div>

                    <Button variant="default" size="lg" className="w-full"
                        onClick={() => handleConnectWallet('provider')} disabled={isConnecting} >
                        <Wallet className="w-5 h-5" />
                        {isConnecting ? <LoaderCircle /> : 'Connect as Provider'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};