export async function POST(request) {

    const body = await request.json()

    console.log("Données reçues sur le serveur :", body);
  return Response.json({
    success: true,
    message: "Données reçues avec succès sur le serveur.",
    data: body
  });
}
