"use client";

import { gql, useQuery } from "@apollo/client";
import { Alert, Card, Spinner } from "flowbite-react";
import { HiInformationCircle } from "react-icons/hi";
import { Vehicle, VehicleFormat } from "./Vehicle";

export interface VehicleListProps {
    selectedVehicle?: VehicleFormat;
    onSelection: (vehicle: VehicleFormat) => void;
    searchFilter?: string;
}

export const VehicleList: React.FC<VehicleListProps> = ({ selectedVehicle, onSelection, searchFilter }) => {
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

    const vars = { page: 0, size: 15, search: searchFilter };
    const { loading, error, data } = useQuery(VEHICLE_LIST_QUERY, { variables: vars });

    return (
        <div style={{ minHeight: "50vh" }}>
            {loading && (
                <div className="flex flex-row flex-wrap gap-4 justify-center">
                    {[...Array(15)].map((_, i) => (
                        <Card key={i} className="w-48 h-48">
                            <div className="flex flex-col items-center justify-center h-full">
                                <Spinner />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
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
