const SOAP_URL = process.env.NEXT_PUBLIC_SOAP_URL as string;

if (!SOAP_URL) throw new Error("NEXT_PUBLIC_SOAP_URL is not defined in the environment variables.");

export default SOAP_URL;
