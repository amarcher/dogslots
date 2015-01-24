class WelcomeController < ApplicationController

	def index
		@dogs = Dog.all
		@debug = params[:debug] if params[:debug]
	end

	def show
		render 'three_js'
	end
	
end
