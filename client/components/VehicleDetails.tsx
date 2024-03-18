"use client";

import { gql, useQuery } from "@apollo/client";
import { VehicleFormat } from "./Vehicle";
import { HiInformationCircle } from "react-icons/hi";
import { Alert, Card, Spinner, Table } from "flowbite-react";
import Image from "next/image";

export interface VehicleDetailsProps {
    vehicle: VehicleFormat;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle }) => {
    const VEHICLE_DETAILS_QUERY = gql`
        query vehicle($vehicleId: ID!) {
            vehicle(id: $vehicleId) {
                naming {
                    make
                    model
                    chargetrip_version
                }
                media {
                    image {
                        url
                    }
                    brand {
                        thumbnail_url
                    }
                }
                battery {
                    usable_kwh
                }
                range {
                    best {
                        highway
                        city
                        combined
                    }
                    worst {
                        highway
                        city
                        combined
                    }
                    chargetrip_range {
                        best
                        worst
                    }
                }
                routing {
                    fast_charging_support
                }
                connectors {
                    standard
                }
                performance {
                    acceleration
                    top_speed
                }
            }
        }
    `;

    const { loading, error, data } = useQuery(VEHICLE_DETAILS_QUERY, { variables: { vehicleId: vehicle.id } });

    return (
        <div>
            {loading && <Spinner size={128} />}
            {error && (
                <Alert color="failure" icon={HiInformationCircle}>
                    <span className="font-medium">Query alert!</span> Error while submitting the query.
                </Alert>
            )}
            {data && !loading && error === undefined && (
                <div className="flex flex-row flex-wrap gap-4 justify-center">
                    <Card
                        key={vehicle.id}
                        className="max-w-lg ms-5 me-5 mb-3 shadow-xl"
                        renderImage={() => (
                            <Image
                                width={300}
                                height={300}
                                src={vehicle.media.image.thumbnail_url}
                                alt="EV"
                                className="w-auto h-auto"
                                priority={true}
                            ></Image>
                        )}
                    >
                        <h5 className="text-2xl text-center font-bold tracking-tight text-gray-900">
                            {vehicle.naming.make} {vehicle.naming.model}{" "}
                        </h5>
                        <Table>
                            <Table.Head>
                                <Table.HeadCell>Caractèristique</Table.HeadCell>
                                <Table.HeadCell>Valeur</Table.HeadCell>
                            </Table.Head>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell>Version</Table.Cell>
                                    <Table.Cell>{vehicle.naming.chargetrip_version}</Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>Batterie</Table.Cell>
                                    <Table.Cell>{data.vehicle.battery.usable_kwh} kWh</Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>Autonomie</Table.Cell>
                                    <Table.Cell>
                                        <ul>
                                            <li>Meilleur cas: {data.vehicle.range.best.combined} km</li>
                                            <li>Pire cas: {data.vehicle.range.worst.combined} km</li>
                                            <li>
                                                Estimation précise:{" "}
                                                <strong>
                                                    {data.vehicle.range.chargetrip_range.worst} - {data.vehicle.range.chargetrip_range.best} km
                                                </strong>
                                            </li>
                                        </ul>
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>Performance</Table.Cell>
                                    <Table.Cell>
                                        <ul>
                                            <li>Accélération: {data.vehicle.performance.acceleration} s</li>
                                            <li>Vitesse max: {data.vehicle.performance.top_speed} km/h</li>
                                        </ul>
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        </Table>
                    </Card>
                </div>
            )}
        </div>
    );

    return <div></div>;
};
