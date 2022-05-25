import logging

from flask_restx import Namespace, Resource, errors, fields, reqparse

from repository import Superheroes, db


api = Namespace("superheroes", description="Api for working with Superheroes")

@api.route("/slug/<slug>")
@api.param("slug", "The superhero's slug")
@api.response(404, "Superhero not found")
class SuperheroBySlug(Resource):
    @api.doc("get_superhero_by_slug")
    @api.marshal_with(superhero_model)
    def get(self, slug):
        """Fetch a superhero given its slug"""
        logging.info(f"fetching superhero with slug: {slug}")
        sh = db.get(Superheroes.slug == slug)
        if sh is None:
            errors.abort(404, message="superhero not found", slug=slug)
        else:
            return sh