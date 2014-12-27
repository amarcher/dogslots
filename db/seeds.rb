require 'csv'

# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

file_name = 'db/Compound Dogs - Compound.csv'

CSV.foreach(file_name) do |row|
	row_num = $.
	next if row_num < 2
  row.each_with_index do |col, index|
  	next if index < 1
  	match = (row_num == index + 1) 
  	Dog.create(name: col, match: match, posone: (row_num - 1), postwo: index) unless index == 0
  end
end