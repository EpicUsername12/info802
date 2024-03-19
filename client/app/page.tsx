"use client";

import { ApolloProvider } from "@apollo/client";
import ChargeTripClient from "@/utils/ChargeTripClient";
import { VehicleList } from "@/components/VehicleList";
import { useEffect, useState } from "react";
import { Button, Progress, TextInput } from "flowbite-react";
import { VehicleFormat } from "@/components/Vehicle";
import { VehicleDetails, VehicleDetailsGQL } from "@/components/VehicleDetails";
import { MapComponent } from "@/components/MapComponent";

export default function Home() {
    const maxStepCount = 3;
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [currentPercentage, setCurrentPercentage] = useState<number>(0);
    const [currentVehicle, setCurrentVehicle] = useState<VehicleFormat | undefined>(undefined);
    const [currentVehicleDetails, setCurrentVehicleDetails] = useState<VehicleDetailsGQL | undefined>(undefined);
    const [searchFilter, setSearchFilter] = useState<string>("");

    const vehicleRange =
        (currentVehicleDetails &&
            ((currentVehicleDetails.range.chargetrip_range.worst + currentVehicleDetails.range.chargetrip_range.best) * 1000) / 2) ||
        250000;

    function toStep(step: number) {
        setCurrentStep(step);
    }

    function toNextStep() {
        if (currentStep < maxStepCount) {
            setCurrentStep(currentStep + 1);
        }
    }

    function toPreviousStep() {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }

    // Create a timer that will animate forward/backward the progress bar
    useEffect(() => {
        const interval = setInterval(() => {
            const targetPercentage = Math.min(Math.ceil((currentStep / maxStepCount) * 100), 100);
            if (currentPercentage < targetPercentage) {
                setCurrentPercentage(currentPercentage + 1);
            } else if (currentPercentage > targetPercentage) {
                setCurrentPercentage(currentPercentage - 1);
            }
        }, 10);

        return () => clearInterval(interval);
    }, [currentStep, currentPercentage, maxStepCount]);

    return (
        <ApolloProvider client={ChargeTripClient}>
            <main className="flex flex-col items-center justify-between p-12 min-h-screen">
                <div className="flex flex-col gap-y-8">
                    <div>
                        <Progress progress={currentPercentage} />
                    </div>
                    <div>
                        {currentStep <= 1 && <h1 className="text-4xl text-center font-bold">Veuillez sélectionner un véhicule</h1>}
                        {currentStep === 2 && (
                            <h1 className="text-4xl text-center font-bold">Veuillez vérifier les caractèristiques de votre véhicule</h1>
                        )}
                        {currentStep === 3 && <h1 className="text-4xl text-center font-bold">Veuillez choisir un itinéraire</h1>}
                    </div>
                    <div>
                        {currentStep <= 1 && (
                            <TextInput
                                value={searchFilter}
                                onChange={(event) => setSearchFilter(event.target.value)}
                                className="w-1/2 mx-auto text-center"
                                placeholder="Chercher un modèle"
                            />
                        )}
                    </div>
                    <div className="py-4">
                        {currentStep <= 1 && (
                            <VehicleList
                                selectedVehicle={currentVehicle}
                                onSelection={(vehicle: VehicleFormat) => {
                                    toStep(1);
                                    setCurrentVehicle(vehicle);
                                }}
                                searchFilter={searchFilter}
                            />
                        )}
                        {currentStep === 2 && currentVehicle && (
                            <VehicleDetails
                                vehicle={currentVehicle}
                                onFetched={(details: VehicleDetailsGQL) => {
                                    setCurrentVehicleDetails(details);
                                    toStep(3);
                                }}
                            />
                        )}
                        {currentStep === 3 && currentVehicleDetails && (
                            <MapComponent autonomie={vehicleRange} temps_recharge={currentVehicleDetails.routing.fast_charging_support ? 30 : 60} />
                        )}
                    </div>
                    {currentStep <= 1 && (
                        <Button onClick={() => toStep(2)} className="w-1/2 mx-auto my-4" disabled={currentVehicle === undefined} color="green">
                            Sélectionner ce véhicule
                        </Button>
                    )}
                    {currentStep === 2 && (
                        <>
                            <Button onClick={() => toStep(1)} className="w-1/2 mx-auto my-1" color="red">
                                Retour
                            </Button>
                        </>
                    )}
                    {currentStep === 3 && (
                        <Button onClick={() => toStep(2)} className="w-1/2 mx-auto my-1" color="red">
                            Retour
                        </Button>
                    )}
                </div>
            </main>
        </ApolloProvider>
    );
}
