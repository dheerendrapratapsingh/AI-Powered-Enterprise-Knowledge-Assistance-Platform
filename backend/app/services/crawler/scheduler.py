import time
import threading
import logging
from datetime import datetime, timezone
from app.database.connection import SessionLocal
from app.models.crawler import CrawlConfig, CrawlJob
from app.services.crawler.crawler_service import launch_crawl_job

logger = logging.getLogger(__name__)

class CrawlScheduler:
    def __init__(self, check_interval_seconds: int = 60):
        self.check_interval = check_interval_seconds
        self._running = False
        self._thread: threading.Thread = None

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info("CrawlScheduler background service started.")

    def stop(self):
        self._running = False

    def _run_loop(self):
        while self._running:
            try:
                self._check_and_trigger_scheduled_jobs()
            except Exception as e:
                logger.error(f"Error in CrawlScheduler loop: {e}")
            time.sleep(self.check_interval)

    def _check_and_trigger_scheduled_jobs(self):
        db = SessionLocal()
        try:
            active_configs = db.query(CrawlConfig).filter(
                CrawlConfig.is_active == True,
                CrawlConfig.schedule.in_(["daily", "weekly"])
            ).all()

            for config in active_configs:
                # Check if there is already a running or pending job for this config
                active_job = db.query(CrawlJob).filter(
                    CrawlJob.config_id == config.id,
                    CrawlJob.status.in_(["PENDING", "RUNNING"])
                ).first()

                if active_job:
                    continue # Do not start concurrent crawls for same config

                # Check last completed job time
                last_job = db.query(CrawlJob).filter(
                    CrawlJob.config_id == config.id,
                    CrawlJob.status == "COMPLETED"
                ).order_by(CrawlJob.created_at.desc()).first()

                now = datetime.now(timezone.utc)
                should_trigger = False

                if not last_job:
                    should_trigger = True
                else:
                    elapsed = (now - last_job.created_at.replace(tzinfo=timezone.utc)).total_seconds()
                    if config.schedule == "daily" and elapsed >= 86400: # 24 hours
                        should_trigger = True
                    elif config.schedule == "weekly" and elapsed >= 604800: # 7 days
                        should_trigger = True

                if should_trigger:
                    new_job = CrawlJob(config_id=config.id, status="PENDING")
                    db.add(new_job)
                    db.commit()
                    db.refresh(new_job)
                    launch_crawl_job(new_job.id)
                    logger.info(f"Triggered scheduled crawl job {new_job.id} for config '{config.name}'")

        finally:
            db.close()

scheduler = CrawlScheduler()
