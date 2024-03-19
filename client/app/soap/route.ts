import SOAP_URL from "@/utils/SOAP_URL";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const soapBody = await request.text();
        const response = await fetch(SOAP_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction: "info802.tp.soap.trajet/CalculTemps",
            },
            body: soapBody,
        });

        const responseText = await response.text();
        return new NextResponse(responseText, { status: response.status });
    } catch (err) {
        return new NextResponse("{}", { status: 500 });
    }
}
