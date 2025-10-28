
import React, { useEffect, useState, ReactNode, useCallback } from 'react';

import { useAuth } from '../hooks/useAuth';

import { supabase } from '../lib/supabase';

import { BranchContext, BranchType, ViewMode } from './BranchContextValue';



interface BranchProviderProps {

  children: ReactNode;

}



export function BranchProvider({ children }: BranchProviderProps) {

  const { profile, user } = useAuth();

  // Fixed: canAccessBranch initialization order

  const [activeBranch, setActiveBranchState] = useState<BranchType>('calicut');

  const [viewMode, setViewMode] = useState<ViewMode>('single');

  const [branchStatus, setBranchStatus] = useState<{ [key: string]: any }>({});

  const [loading, setLoading] = useState(true);

  const [isSwitching, setIsSwitching] = useState(false);



  // User permissions from profile

  const userBranchAccess = profile?.branch_assigned || 'calicut';

  const userAccessLevel = profile?.role || 'staff';



  const canAccessBranch = useCallback((branch: BranchType): boolean => {

    if (!profile) return false;



    // Super admins and admins can access all branches

    if (userAccessLevel === 'super_admin' || userAccessLevel === 'admin') {

      return true;

    }



    // Staff can only access their assigned branch

    if (branch === 'global') return userAccessLevel === 'super_admin' || userAccessLevel === 'admin';



    return userBranchAccess === branch;

  }, [profile, userAccessLevel, userBranchAccess]);



  const loadBranchStatus = useCallback(async () => {

    try {

      const { data, error } = await supabase

        .from('branch_status')

        .select('*')

        .order('branch_name');



      if (error) {

        console.error('❌ Error loading branch status:', error.message);

        return;

      }



      if (data) {

        const statusMap = data.reduce((acc, status) => {

          acc[status.branch_name] = status;

          return acc;

        }, {} as { [key: string]: any });



        setBranchStatus(statusMap);

      }

    } catch (error: any) {

      console.error('❌ Exception loading branch status:', error.message);

    } finally {

      setLoading(false);

    }

  }, []);



  const setActiveBranch = useCallback(async (branch: BranchType) => {

    if (!canAccessBranch(branch) || branch === activeBranch) return;



    setIsSwitching(true);



    try {

      localStorage.setItem('fets-active-branch', branch);

      await new Promise(resolve => setTimeout(resolve, 150));

      setActiveBranchState(branch);



      if (viewMode === 'dual' && branch !== 'global') {

        setViewMode('single');

      }



      console.log(`🏢 Switched to ${branch} branch`);

    } finally {

      setTimeout(() => setIsSwitching(false), 300);

    }

  }, [canAccessBranch, activeBranch, viewMode]);



  // Load initial branch preference from localStorage or user's assigned branch

  useEffect(() => {

    if (profile) {

      const savedBranch = localStorage.getItem('fets-active-branch') as BranchType;

      const defaultBranch = profile.branch_assigned === 'both' ? 'calicut' : profile.branch_assigned;



      if (savedBranch && canAccessBranch(savedBranch)) {

        setActiveBranchState(savedBranch);

      } else {

        setActiveBranchState(defaultBranch);

      }

    }

  }, [profile, canAccessBranch]);



  // Load branch status data

  useEffect(() => {

    loadBranchStatus();

  }, [loadBranchStatus]);



  // Set up real-time subscriptions for branch status

  useEffect(() => {

    const subscription = supabase

      .channel('branch-status-changes')

      .on('postgres_changes',

        { event: '*', schema: 'public', table: 'branch_status' },

        () => {

          console.log('🔄 Branch status updated, reloading...');

          loadBranchStatus();

        }

      )

      .subscribe();



    return () => {

      subscription.unsubscribe();

    };

  }, [loadBranchStatus]);



  const canUseDualMode = (): boolean => {

    return userAccessLevel === 'super_admin' || userAccessLevel === 'admin';

  };



  const getBranchTheme = (branch: BranchType): string => {

    switch (branch) {

      case 'calicut':

        return 'branch-calicut';

      case 'cochin':

        return 'branch-cochin';

      case 'global':

        return 'branch-global';

      default:

        return 'branch-calicut';

    }

  };



  const value = {

    activeBranch,

    setActiveBranch,

    viewMode,

    setViewMode,

    userBranchAccess,

    userAccessLevel,

    branchStatus,

    loading,

    isSwitching,

    canAccessBranch,

    canUseDualMode,

    getBranchTheme

  };



  return (

    <BranchContext.Provider value={value}>

      {children}

    </BranchContext.Provider>

  );

}



