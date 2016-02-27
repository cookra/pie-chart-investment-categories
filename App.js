Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    launch: function() {
        this.add({
            xtype: 'rallyreleasecombobox',
            itemId: 'releaseComboBox',
            fieldLabel: 'Filter by Release:',
            context: this.getContext().getDataContext(),
            listeners: {
                ready: this.getFeaturesInRelease,
                select: this.getFeaturesInRelease,
                scope: this
            }
        });
    },

    getFeaturesInRelease: function(release) {
        var releaseRef = release.getValue();
        console.log('release', releaseRef);
        console.log(this.getContext().getDataContext());
        var store = Ext.create('Rally.data.wsapi.Store', {
            model:"portfolioitem/feature",
            autoLoad:true,
            limit:Infinity,
            fetch:['FormattedID','Name','Project','InvestementCategory'],
            filters: [
                {
                    property: 'Release',
                    value: releaseRef
                }
            ],
            listeners:{
                load:function(store, records) {
                    this.processResults(records);
                },
                scope:this
            },
            context:this.getContext().getDataContext(),
        });
    },
    processResults:function(records){
        _.each(records, function(record){
            console.log('FormattedID: ', record.get('FormattedID'),
                        'Name', record.get('Name'),
                        'InvestementCategory:',record.get('InvestementCategory') );
        });
    }
});