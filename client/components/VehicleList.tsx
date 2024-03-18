"use client";

import { gql, useQuery } from "@apollo/client";
import { Alert, Card, Spinner } from "flowbite-react";
import { HiInformationCircle } from "react-icons/hi";
import { Vehicle, VehicleFormat } from "./Vehicle";

export interface VehicleListProps {
    selectedVehicle?: VehicleFormat;
    onSelection: (vehicle: VehicleFormat) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ selectedVehicle, onSelection }) => {
    const VEHICLE_LIST_QUERY = gql`
        query vehicleList($page: Int, $size: Int, $search: String) {
            vehicleList(page: $page, size: $size, search: $search) {
                id
                naming {
                    make
                    model
                    chargetrip_version
                }
                media {
                    image {
                        thumbnail_url
                    }
                }
            }
        }
    `;

    const { loading, error, data } = useQuery(VEHICLE_LIST_QUERY, { variables: { page: 0, size: 15 } });

    return (
        <div>
            {loading && <Spinner size={32} />}
            {error && (
                <Alert color="failure" icon={HiInformationCircle}>
                    <span className="font-medium">Query alert!</span> Error while submitting the query.
                </Alert>
            )}
            {data && !loading && error === undefined && (
                <div className="flex flex-row flex-wrap gap-4 justify-center">
                    {data.vehicleList.map((vehicle: VehicleFormat) => {
                        return (
                            <div key={vehicle.id} onClick={() => onSelection(vehicle)}>
                                <Vehicle vehicle={vehicle} selected={selectedVehicle?.id === vehicle.id} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
