# Serveur SOAP pour le calcul de trajet en voiture électrique
# Auteur: Chettibi Tarik

# pip install requests
# pip install lxml
# pip install spyne
import requests
import math
from spyne import Application, rpc, ServiceBase, Float, Array
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication

openrouteservice_token = "5b3ce3597851110001cf624884cf30f4883c492d828cc99ae2d29b90"

# Example: http://spyne.io/#inprot=Soap11&outprot=Soap11&s=rpc&tpt=WsgiApplication&validator=true


def calcul_distance(start: tuple[float, float], end: tuple[float, float]):
    # Convert degrees to radians
    start_lon, start_lat = math.radians(start[0]), math.radians(start[1])
    end_lon, end_lat = math.radians(end[0]), math.radians(end[1])

    # Radius of the Earth in kilometers
    radius = 6371.01

    # Haversine formula
    delta_lon = end_lon - start_lon
    delta_lat = end_lat - start_lat
    a = math.sin(delta_lat / 2) ** 2 + math.cos(start_lat) * math.cos(end_lat) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c * 1000  # En mètres


def get_bornes(pos: tuple[float, float], distance: float, limit: int = 5):

    print("get_bornes()")

    url = "https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records"
    query = {
        "limit": limit,
        "where": f"distance(geo_point_borne, geom'POINT({pos[0]} {pos[1]})', {distance}km)",
    }

    response = requests.get(url, params=query)
    res = response.json()
    return res["results"]


def get_routes(start: tuple[float, float], end: tuple[float, float]):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    query = {
        "api_key": openrouteservice_token,
        "start": f"{start[0]},{start[1]}",
        "end": f"{end[0]},{end[1]}",
    }

    response = requests.get(url, params=query)
    return response.json()


DISTANCE_LOOKUP_BORNE = 10
VITESSE_MOYENNE = 60


class ServiceTempsTrajet(ServiceBase):
    # Distance en mètre
    # Autonomie en mètre
    # Temps de recharge complète en minute
    @rpc(Float, Float, Float, Float, Float, Float, _returns=(Float, Array(Array(Float))), _out_variable_names=["TotalTemps", "BornesRecharge"])
    def CalculTemps(ctx,
                    start_long: Float,
                    end_long: Float,
                    start_lat: Float,
                    end_lat: Float,
                    autonomie: Float,
                    temps_recharge: tuple[Float, Array]):

        routes = get_routes((start_long, start_lat), (end_long, end_lat))

        feature = routes["features"][0]
        distance_totale = feature["properties"]["summary"]["distance"]
        estimation_temps_sans_recharge = feature["properties"]["summary"]["duration"] / 60 / 60

        print("Distance totale: ", distance_totale, "m")
        print("Estimation temps sans recharge: ", estimation_temps_sans_recharge, "h")

        steps = feature["geometry"]["coordinates"]

        distance_parcourue = 0
        bornes = []
        temps_total = 0

        for i in range(0, len(steps) - 1):

            step = steps[i]
            next_step = steps[i + 1]

            distance = calcul_distance((step[0], step[1]), (next_step[0], next_step[1]))
            distance_parcourue += distance

            if distance_parcourue > autonomie:
                print("Doit recharger: ", distance_parcourue, autonomie)
                borne = None
                max_dist = DISTANCE_LOOKUP_BORNE
                while borne is None or max_dist > 50:
                    current_bornes = get_bornes((step[0], step[1]), max_dist, 1)
                    if len(current_bornes) == 0:
                        max_dist += 10
                    else:
                        borne = current_bornes[0]
                        break

                if borne is None:
                    raise Exception("Pas de borne de recharge à proximité")

                temps_total += temps_recharge
                bornes.append(borne)
                distance_parcourue = 0

            temps_total += distance / 1000 / VITESSE_MOYENNE * 60

        bornes = map(lambda x: [x["geo_point_borne"]["lon"], x["geo_point_borne"]["lat"]], bornes)
        print((temps_total / 60, bornes))
        return (temps_total / 60, bornes)


application = Application([ServiceTempsTrajet], 'info802.tp.soap.trajet',
                          in_protocol=Soap11(validator='lxml'),
                          out_protocol=Soap11())


class SimpleCorsMiddleware(object):
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def cors_start_response(status, response_headers, exc_info=None):
            cors_headers = [('Access-Control-Allow-Origin', '*'),
                            ('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'),
                            ('Access-Control-Allow-Headers', 'SOAPAction, Content-Type')]
            response_headers.extend(cors_headers)
            return start_response(status, response_headers, exc_info)

        if environ.get('REQUEST_METHOD') == 'OPTIONS':
            cors_start_response('200 OK', [('Content-Type', 'text/plain')])
            return []

        return self.app(environ, cors_start_response)


if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    wsgi_application = WsgiApplication(application)
    wsgi_application = SimpleCorsMiddleware(wsgi_application)

    server = make_server('0.0.0.0', 22220, wsgi_application)
    server.serve_forever()
