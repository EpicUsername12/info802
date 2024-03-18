# Serveur SOAP pour le calcul de trajet en voiture électrique
# Auteur: Chettibi Tarik

# pip install lxml
# pip install spyne
# pip install openrouteservice
import openrouteservice
from spyne import Application, rpc, ServiceBase, Float
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication

openrouteservice_token = "5b3ce3597851110001cf624884cf30f4883c492d828cc99ae2d29b90"

# Example: http://spyne.io/#inprot=Soap11&outprot=Soap11&s=rpc&tpt=WsgiApplication&validator=true

ors_client = openrouteservice.Client(key=openrouteservice_token)  # Specify your personal API key


class ServiceTempsTrajet(ServiceBase):
    # Distance en mètre
    # Autonomie en mètre
    # Temps de recharge complète en minute
    @rpc(Float, Float, Float, Float, Float, Float, _returns=Float)
    def CalculTemps(ctx,
                    start_long: Float,
                    end_long: Float,
                    start_lat: Float,
                    end_lat: Float,
                    autonomie: Float,
                    temps_recharge: Float):

        coords = ((start_long, start_lat), (end_long, end_lat))
        routes = ors_client.directions(coords)

        print(routes)

        distance = 1200

        # Calcul nombre de pauses
        n_pauses = (distance + 10) // autonomie  # +10 pour la sécurité
        # Calcul temps de recharge en minute
        temps_recharge_total = n_pauses * temps_recharge

        # Calcul temps total
        vitesse_moyenne = 70  # km/h
        distance_km = distance / 1000

        # Nombre d'heure de conduite
        temps_trajet = distance_km / vitesse_moyenne

        # On ajoute le temps de recharge
        temps_total = temps_trajet + temps_recharge_total / 60

        return temps_total


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

    server = make_server('0.0.0.0', 22220, wsgi_application)
    server.serve_forever()
