"use client";

import Image from "next/image";
import { Card } from "flowbite-react";

export interface VehicleFormat {
    id: string;
    naming: {
        make: string;
        model: string;
        chargetrip_version: string;
    };
    media: {
        image: {
            thumbnail_url: string;
        };
    };
}

export interface VehicleProps {
    vehicle: VehicleFormat;
    selected: boolean;
}

export const Vehicle: React.FC<VehicleProps> = ({ vehicle, selected }) => {
    return (
        <Card
            key={vehicle.id}
            className={`max-w-sm ms-5 me-5 mb-3 shadow-xl ${selected ? "border-4 border-green-500" : ""}`}
            renderImage={() => (
                <Image width={300} height={300} src={vehicle.media.image.thumbnail_url} alt="EV" className="w-auto h-auto" priority={true}></Image>
            )}
        >
            <h5 className="text-2xl text-center font-bold tracking-tight text-gray-900">
                {vehicle.naming.make} {vehicle.naming.model}{" "}
            </h5>
        </Card>
    );
};
