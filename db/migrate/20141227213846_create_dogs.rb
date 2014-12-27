class CreateDogs < ActiveRecord::Migration
  def change
    create_table :dogs do |t|
    	t.string :name
    	t.boolean :match
    	t.integer :payout
    	t.integer :posone
    	t.integer :postwo
    end
  end
end
