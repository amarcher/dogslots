class WelcomeController < ApplicationController

	def index
		@dogs = Dog.all
		@debug = params[:debug] if params[:debug]
	end
	
end
