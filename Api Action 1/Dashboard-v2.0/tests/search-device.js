import dotenv from 'dotenv';
dotenv.config();

const credentials = {
    grant_type: 'client_credentials',
    client_id: process.env.ACTION1_CLIENT_ID,
    client_secret: process.env.ACTION1_CLIENT_SECRET,
    scope: 'api'
};

async function searchDevice(searchName) {
    try {
        const authRes = await fetch('https://app.action1.com/api/3.0/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(credentials)
        });
        const { access_token } = await authRes.json();
        
        const headers = { 
            Authorization: `Bearer ${access_token}`, 
            Accept: 'application/json' 
        };
        
        const orgRes = await fetch('https://app.action1.com/api/3.0/organizations', { headers });
        const orgData = await orgRes.json();
        const orgId = orgData.items[0].id;
        
        const devRes = await fetch(`https://app.action1.com/api/3.0/endpoints/managed/${orgId}?fields=*&limit=200`, { headers });
        const devData = await devRes.json();
        
        const device = devData.items.find(d => 
            d.name?.includes(searchName) || 
            d.device_name?.includes(searchName)
        );
        
        if (device) {
            console.log('\n✅ Dispositivo encontrado:\n');
            console.log(JSON.stringify(device, null, 2));
        } else {
            console.log(`❌ Dispositivo "${searchName}" não encontrado`);
            console.log('\nPrimeiros 5 dispositivos:');
            devData.items.slice(0, 5).forEach(d => {
                console.log(`  - ${d.name || d.device_name}`);
            });
        }
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

const searchName = process.argv[2] || 'SJPCRONTB091';
searchDevice(searchName);
