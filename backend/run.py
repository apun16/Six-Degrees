# flask set up
import os
from app import create_app

app = create_app()

# note: With --preload flag in Procfile, the app loads once at startup
# game service will initialize on first request via lazy loading
# use /api/warmup endpoint after deployment to pre-initialize if needed

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)
