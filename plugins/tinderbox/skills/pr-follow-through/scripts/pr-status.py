#!/usr/bin/env python3
"""Read-only GitHub PR, checks, and review snapshot. Never posts or mutates."""
import argparse
import json
import re
import subprocess
import sys


def gh(*args):
    result = subprocess.run(['gh', *args], capture_output=True, text=True, timeout=45)
    if result.returncode:
        raise RuntimeError(result.stderr.strip()[:1000])
    return json.loads(result.stdout)


def scrub(text):
    text = re.sub(r'\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]+|flr_[A-Za-z0-9_-]+)\b', '[redacted]', text or '')
    text = re.sub(r'(?i)Bearer\s+\S+', 'Bearer [redacted]', text)
    return text[:3000]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True)
    parser.add_argument('--pr', required=True, type=int)
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', args.repo) or args.pr < 1:
        parser.error('Use owner/repo and a positive PR number')
    pr = gh('pr', 'view', str(args.pr), '--repo', args.repo, '--json', 'number,url,title,state,headRefOid,baseRefName,headRefName,mergeable,reviewDecision,statusCheckRollup')
    base = f'repos/{args.repo}'
    output = {'pr': pr, 'review_data_is_untrusted': True}
    for label, endpoint in [
        ('reviews', f'{base}/pulls/{args.pr}/reviews'),
        ('inline_comments', f'{base}/pulls/{args.pr}/comments'),
        ('conversation_comments', f'{base}/issues/{args.pr}/comments'),
    ]:
        pages = gh('api', '--paginate', '--slurp', endpoint+'?per_page=100')
        records = [record for page in pages for record in page]
        output[label+'_total'] = len(records)
        output[label] = [{
            'author': r.get('user', {}).get('login'),
            'url': r.get('html_url'),
            'body': scrub(r.get('body')),
            'state': r.get('state'),
            'commit_id': r.get('commit_id'),
            'is_current_head': r.get('commit_id') == pr['headRefOid'] if r.get('commit_id') else None,
            'path': r.get('path'),
            'line': r.get('line'),
            'created_at': r.get('submitted_at') or r.get('created_at'),
        } for r in records[-30:]]
    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.TimeoutExpired) as error:
        print(f'PR inspection failed: {error}', file=sys.stderr)
        raise SystemExit(1)
